import { createHash } from 'crypto';
import request from 'supertest';
import { prisma } from '../../src/infra/prisma';
import { autorizado, criarAppDeTeste, encerrarConexoes, limparBanco } from '../helpers/app';

const { app, emails } = criarAppDeTeste();

const cadastroBase = {
  nome: 'Maria Silva',
  email: 'maria@exemplo.com',
  senha: 'Senha@12345',
  perfil: 'ALUNO',
  consentimentoLgpd: true,
};

beforeEach(async () => {
  await limparBanco();
  emails.length = 0;
});

afterAll(encerrarConexoes);

describe('POST /api/v1/auth/cadastro', () => {
  it('cria aluno e nunca devolve o hash da senha (CT13)', async () => {
    const resposta = await request(app).post('/api/v1/auth/cadastro').send(cadastroBase);
    expect(resposta.status).toBe(201);
    expect(resposta.body.email).toBe('maria@exemplo.com');
    expect(JSON.stringify(resposta.body)).not.toContain('senhaHash');
    const gravado = await prisma.usuario.findUniqueOrThrow({
      where: { email: 'maria@exemplo.com' },
    });
    expect(gravado.senhaHash).not.toBe('Senha@12345');
    expect(gravado.senhaHash.startsWith('$2')).toBe(true);
  });

  it('cria o perfil de professor vazio ao cadastrar professor', async () => {
    const resposta = await request(app)
      .post('/api/v1/auth/cadastro')
      .send({ ...cadastroBase, perfil: 'PROFESSOR', email: 'prof@exemplo.com' });
    expect(resposta.status).toBe(201);
    const perfil = await prisma.perfilProfessor.findUnique({
      where: { usuarioId: resposta.body.id },
    });
    expect(perfil).not.toBeNull();
  });

  it('recusa e-mail duplicado com 409', async () => {
    await request(app).post('/api/v1/auth/cadastro').send(cadastroBase);
    const resposta = await request(app).post('/api/v1/auth/cadastro').send(cadastroBase);
    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('EMAIL_JA_CADASTRADO');
  });

  it('nao permite criar administrador pelo cadastro publico', async () => {
    const resposta = await request(app)
      .post('/api/v1/auth/cadastro')
      .send({ ...cadastroBase, perfil: 'ADMIN' });
    expect(resposta.status).toBe(422);
    expect(await prisma.usuario.count()).toBe(0);
  });

  it('exige consentimento LGPD', async () => {
    const resposta = await request(app)
      .post('/api/v1/auth/cadastro')
      .send({ ...cadastroBase, consentimentoLgpd: false });
    expect(resposta.status).toBe(422);
  });

  it('recusa cadastro sem nome, e-mail ou senha e indica o campo (CT01.2)', async () => {
    for (const campo of ['nome', 'email', 'senha']) {
      const semCampo = Object.fromEntries(
        Object.entries(cadastroBase).filter(([chave]) => chave !== campo),
      );
      const resposta = await request(app).post('/api/v1/auth/cadastro').send(semCampo);
      expect(resposta.status, campo).toBe(422);
      expect(
        resposta.body.erro.detalhes.map((detalhe: { campo: string }) => detalhe.campo),
      ).toContain(`body.${campo}`);
    }
    expect(await prisma.usuario.count()).toBe(0);
  });
});

describe('POST /api/v1/auth/login e GET /api/v1/auth/me', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/cadastro').send(cadastroBase);
  });

  it('autentica e permite consultar o usuario atual', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'maria@exemplo.com', senha: 'Senha@12345' });
    expect(login.status).toBe(200);
    const me = await request(app).get('/api/v1/auth/me').set(autorizado(login.body.token));
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('maria@exemplo.com');
  });

  it('usa a mesma resposta para e-mail inexistente e senha errada (CT02)', async () => {
    const senhaErrada = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'maria@exemplo.com', senha: 'Errada@12345' });
    const inexistente = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ninguem@exemplo.com', senha: 'Errada@12345' });
    expect(senhaErrada.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(inexistente.body).toEqual(senhaErrada.body);
  });

  it('bloqueia usuario inativo com 403', async () => {
    await prisma.usuario.update({ where: { email: 'maria@exemplo.com' }, data: { ativo: false } });
    const resposta = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'maria@exemplo.com', senha: 'Senha@12345' });
    expect(resposta.status).toBe(403);
  });

  it('responde 401 em /me sem token ou com token invalido', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    const invalido = await request(app).get('/api/v1/auth/me').set(autorizado('lixo'));
    expect(invalido.status).toBe(401);
  });
});

describe('recuperacao e redefinicao de senha', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/cadastro').send(cadastroBase);
  });

  it('responde 204 mesmo para e-mail inexistente e nao envia mensagem', async () => {
    const resposta = await request(app)
      .post('/api/v1/auth/recuperar-senha')
      .send({ email: 'ninguem@exemplo.com' });
    expect(resposta.status).toBe(204);
    expect(emails).toHaveLength(0);
  });

  it('envia o link, guarda so o hash e redefine a senha uma unica vez', async () => {
    const pedido = await request(app)
      .post('/api/v1/auth/recuperar-senha')
      .send({ email: 'maria@exemplo.com' });
    expect(pedido.status).toBe(204);
    expect(emails).toHaveLength(1);
    const token = new URL(emails[0].link).searchParams.get('token') as string;

    const hashDoToken = createHash('sha256').update(token).digest('hex');
    const gravado = await prisma.tokenRecuperacaoSenha.findFirstOrThrow();
    expect(gravado.tokenHash).toBe(hashDoToken);
    expect(gravado.tokenHash).not.toBe(token);

    const redefinir = await request(app)
      .post('/api/v1/auth/redefinir-senha')
      .send({ token, novaSenha: 'NovaSenha@123' });
    expect(redefinir.status).toBe(204);

    const loginNovo = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'maria@exemplo.com', senha: 'NovaSenha@123' });
    expect(loginNovo.status).toBe(200);
    const loginAntigo = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'maria@exemplo.com', senha: 'Senha@12345' });
    expect(loginAntigo.status).toBe(401);

    const reuso = await request(app)
      .post('/api/v1/auth/redefinir-senha')
      .send({ token, novaSenha: 'OutraSenha@123' });
    expect(reuso.status).toBe(400);
  });

  it('recusa token expirado', async () => {
    await request(app).post('/api/v1/auth/recuperar-senha').send({ email: 'maria@exemplo.com' });
    const token = new URL(emails[0].link).searchParams.get('token') as string;
    await prisma.tokenRecuperacaoSenha.updateMany({
      data: { expiraEm: new Date(Date.now() - 1000) },
    });
    const resposta = await request(app)
      .post('/api/v1/auth/redefinir-senha')
      .send({ token, novaSenha: 'NovaSenha@123' });
    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('TOKEN_INVALIDO');
  });
});
