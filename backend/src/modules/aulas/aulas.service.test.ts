import type { Mocked } from 'vitest';
import { capturarErro } from '../../../tests/helpers/erros';
import type { Transacao } from '../../infra/prisma';
import {
  ErroConflito,
  ErroNaoEncontrado,
  ErroProibido,
  ErroRegraNegocio,
} from '../../shared/errors';
import type { UsuarioAutenticado } from '../../shared/types/dominio';
import { criarDataBrasilia } from '../../shared/utils/datas';
import type { ProfessorParaAula } from '../usuarios/usuarios.service';
import type { AulaDetalhe, AulaResumo, AulasRepositorio } from './aulas.repository';
import {
  AulasService,
  type ExecutarEmTransacao,
  type ServicoDeAgendaParaAulas,
  type ServicoDeNotificacoesParaAulas,
  type ServicoDeUsuariosParaAulas,
} from './aulas.service';

const AGORA = criarDataBrasilia(2026, 11, 6, 10, 0);
const INICIO = criarDataBrasilia(2026, 11, 9, 9);
const FIM = criarDataBrasilia(2026, 11, 9, 10);
const tx = {} as Transacao;

const aluno: UsuarioAutenticado = { id: 'u-aluno', perfil: 'ALUNO' };
const professorUsuario: UsuarioAutenticado = { id: 'u-prof', perfil: 'PROFESSOR' };

const professorParaAula: ProfessorParaAula = {
  id: 'p1',
  usuarioId: 'u-prof',
  nome: 'Ana',
  ativo: true,
  modalidades: ['ONLINE', 'PRESENCIAL'],
  materiaIds: ['m1'],
};

const resumo: AulaResumo = {
  id: 'a1',
  inicio: INICIO,
  fim: FIM,
  modalidade: 'ONLINE',
  objetivo: null,
  status: 'SOLICITADA',
  serieId: null,
  motivoCancelamento: null,
  criadoEm: AGORA,
  materia: { id: 'm1', nome: 'Matemática', nivel: 'Médio' },
  aluno: { id: 'u-aluno', nome: 'Caio' },
  professor: { id: 'p1', usuarioId: 'u-prof', nome: 'Ana' },
};

function criarDetalhe(alteracoes: Partial<AulaDetalhe> = {}): AulaDetalhe {
  return { ...resumo, anotacoes: null, historico: [], remarcacoes: [], ...alteracoes };
}

const entradaPadrao = {
  professorId: 'p1',
  materiaId: 'm1',
  inicio: INICIO,
  fim: FIM,
  modalidade: 'ONLINE' as const,
};

function criarServico(detalhe: AulaDetalhe | null = criarDetalhe()) {
  const repositorio: Mocked<AulasRepositorio> = {
    criarAulas: vi.fn().mockResolvedValue([resumo]),
    buscarPorId: vi.fn().mockResolvedValue(detalhe),
    listar: vi.fn().mockResolvedValue({ itens: [resumo], total: 1 }),
    listarIntervalosOcupados: vi.fn().mockResolvedValue([]),
    existeConflito: vi.fn().mockResolvedValue(false),
    transicionar: vi.fn().mockResolvedValue(undefined),
  };
  const usuarios: Mocked<ServicoDeUsuariosParaAulas> = {
    obterProfessorParaAula: vi.fn().mockResolvedValue(professorParaAula),
    obterProfessorIdPorUsuario: vi.fn().mockResolvedValue('p1'),
    obterContato: vi
      .fn()
      .mockResolvedValue({ email: 'outro@exemplo.com', telefone: '61999990000' }),
  };
  const agenda: Mocked<ServicoDeAgendaParaAulas> = {
    estaLivre: vi.fn().mockResolvedValue(true),
  };
  const notificacoes: Mocked<ServicoDeNotificacoesParaAulas> = {
    notificar: vi.fn().mockResolvedValue(undefined),
  };
  const transacao = vi.fn(async (operacao: (cliente: Transacao) => Promise<unknown>) =>
    operacao(tx),
  );
  const servico = new AulasService({
    repositorio,
    usuarios,
    agenda,
    notificacoes,
    transacao: transacao as unknown as ExecutarEmTransacao,
    agora: () => AGORA,
    gerarId: () => 'serie-1',
  });
  return { servico, repositorio, usuarios, agenda, notificacoes, transacao };
}

describe('AulasService', () => {
  describe('solicitar', () => {
    it('cria a aula solicitada e notifica o professor na mesma transacao', async () => {
      const { servico, repositorio, notificacoes, transacao } = criarServico();

      const aulas = await servico.solicitar(aluno, { ...entradaPadrao, objetivo: 'Revisão' });

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(repositorio.criarAulas).toHaveBeenCalledWith(
        tx,
        [
          {
            alunoId: 'u-aluno',
            professorId: 'p1',
            materiaId: 'm1',
            inicio: INICIO,
            fim: FIM,
            modalidade: 'ONLINE',
            objetivo: 'Revisão',
            serieId: null,
          },
        ],
        'u-aluno',
      );
      expect(notificacoes.notificar).toHaveBeenCalledWith(tx, {
        usuarioId: 'u-prof',
        aulaId: 'a1',
        tipo: 'SOLICITACAO',
        mensagem: 'Caio solicitou uma aula de Matemática em 09/11/2026 às 09:00.',
      });
      expect(aulas).toEqual([resumo]);
    });

    it('rejeita aula no passado com 400', async () => {
      const { servico, repositorio } = criarServico();
      const erro = await capturarErro(
        servico.solicitar(aluno, { ...entradaPadrao, inicio: AGORA }),
      );
      expect(erro).toBeInstanceOf(ErroRegraNegocio);
      expect(erro.codigo).toBe('AULA_NO_PASSADO');
      expect(repositorio.criarAulas).not.toHaveBeenCalled();
    });

    it('responde 404 para professor bloqueado', async () => {
      const { servico, usuarios } = criarServico();
      usuarios.obterProfessorParaAula.mockResolvedValue({ ...professorParaAula, ativo: false });
      expect(await capturarErro(servico.solicitar(aluno, entradaPadrao))).toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });

    it('rejeita materia ou modalidade nao oferecidas com 400', async () => {
      const { servico, repositorio } = criarServico();
      const materia = await capturarErro(
        servico.solicitar(aluno, { ...entradaPadrao, materiaId: 'm9' }),
      );
      expect(materia.codigo).toBe('MATERIA_NAO_OFERECIDA');
      const modalidade = await capturarErro(
        servico.solicitar(aluno, { ...entradaPadrao, modalidade: 'DOMICILIO' }),
      );
      expect(modalidade.codigo).toBe('MODALIDADE_NAO_OFERECIDA');
      expect(modalidade).toBeInstanceOf(ErroRegraNegocio);
      expect(repositorio.criarAulas).not.toHaveBeenCalled();
    });

    it('responde 409 quando o horario nao esta livre (CT05)', async () => {
      const { servico, agenda, repositorio, notificacoes } = criarServico();
      agenda.estaLivre.mockResolvedValue(false);

      const erro = await capturarErro(servico.solicitar(aluno, entradaPadrao));

      expect(agenda.estaLivre).toHaveBeenCalledWith('p1', INICIO, FIM);
      expect(erro).toBeInstanceOf(ErroConflito);
      expect(erro.codigo).toBe('HORARIO_INDISPONIVEL');
      expect(repositorio.criarAulas).not.toHaveBeenCalled();
      expect(notificacoes.notificar).not.toHaveBeenCalled();
    });

    it('cria uma serie semanal com o mesmo serieId e uma unica notificacao (RF10)', async () => {
      const { servico, repositorio, notificacoes, agenda } = criarServico();
      const tresAulas = [resumo, { ...resumo, id: 'a2' }, { ...resumo, id: 'a3' }];
      repositorio.criarAulas.mockResolvedValue(tresAulas);

      const aulas = await servico.solicitar(aluno, {
        ...entradaPadrao,
        recorrencia: { semanas: 3 },
      });

      expect(agenda.estaLivre).toHaveBeenCalledTimes(3);
      const [, novas] = repositorio.criarAulas.mock.calls[0];
      expect(novas.map((nova) => nova.serieId)).toEqual(['serie-1', 'serie-1', 'serie-1']);
      expect(novas.map((nova) => nova.inicio)).toEqual([
        INICIO,
        criarDataBrasilia(2026, 11, 16, 9),
        criarDataBrasilia(2026, 11, 23, 9),
      ]);
      expect(novas.map((nova) => nova.fim)).toEqual([
        FIM,
        criarDataBrasilia(2026, 11, 16, 10),
        criarDataBrasilia(2026, 11, 23, 10),
      ]);
      expect(notificacoes.notificar).toHaveBeenCalledTimes(1);
      expect(notificacoes.notificar.mock.calls[0][1].mensagem).toBe(
        'Caio solicitou 3 aulas semanais de Matemática a partir de 09/11/2026 às 09:00.',
      );
      expect(aulas).toHaveLength(3);
    });

    it('nao cria nenhuma aula da serie quando uma ocorrencia esta indisponivel', async () => {
      const { servico, repositorio, agenda } = criarServico();
      agenda.estaLivre
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const erro = await capturarErro(
        servico.solicitar(aluno, { ...entradaPadrao, recorrencia: { semanas: 3 } }),
      );

      expect(erro).toBeInstanceOf(ErroConflito);
      expect(erro.codigo).toBe('HORARIO_INDISPONIVEL');
      expect(erro.message).toContain('16/11/2026 às 09:00');
      expect(repositorio.criarAulas).not.toHaveBeenCalled();
    });

    it('usa um identificador aleatorio para a serie quando nenhum gerador e informado', async () => {
      const { repositorio, usuarios, agenda, notificacoes, transacao } = criarServico();
      const servico = new AulasService({
        repositorio,
        usuarios,
        agenda,
        notificacoes,
        transacao: transacao as unknown as ExecutarEmTransacao,
        agora: () => AGORA,
      });
      await servico.solicitar(aluno, { ...entradaPadrao, recorrencia: { semanas: 2 } });
      const [, novas] = repositorio.criarAulas.mock.calls[0];
      expect(novas[0].serieId).toMatch(/^[0-9a-f-]{36}$/);
      expect(novas[1].serieId).toBe(novas[0].serieId);
    });
  });

  describe('listar', () => {
    const consulta = { pagina: 2, limite: 5 };

    it('lista somente as aulas do aluno autenticado', async () => {
      const { servico, repositorio } = criarServico();
      const pagina = await servico.listar(aluno, { ...consulta, status: 'CONFIRMADA' });
      expect(repositorio.listar).toHaveBeenCalledWith(
        { alunoId: 'u-aluno', status: 'CONFIRMADA', de: undefined, ate: undefined },
        { pagina: 2, limite: 5, pular: 5 },
      );
      expect(pagina).toEqual({ itens: [resumo], total: 1, pagina: 2 });
    });

    it('lista somente as aulas do professor autenticado', async () => {
      const { servico, repositorio, usuarios } = criarServico();
      await servico.listar(professorUsuario, { ...consulta, de: INICIO, ate: FIM });
      expect(usuarios.obterProfessorIdPorUsuario).toHaveBeenCalledWith('u-prof');
      expect(repositorio.listar).toHaveBeenCalledWith(
        { professorId: 'p1', status: undefined, de: INICIO, ate: FIM },
        { pagina: 2, limite: 5, pular: 5 },
      );
    });

    it('nega a listagem para administrador', async () => {
      const { servico } = criarServico();
      const erro = await capturarErro(servico.listar({ id: 'x', perfil: 'ADMIN' }, consulta));
      expect(erro).toBeInstanceOf(ErroProibido);
    });
  });

  describe('obterDetalhe', () => {
    it('nao revela o contato enquanto a aula nao foi confirmada (RNF06)', async () => {
      const { servico, usuarios } = criarServico(criarDetalhe({ status: 'SOLICITADA' }));
      const aula = await servico.obterDetalhe(aluno, 'a1');
      expect(aula.contato).toBeNull();
      expect(usuarios.obterContato).not.toHaveBeenCalled();
    });

    it('revela ao aluno o contato do professor depois da confirmacao', async () => {
      const { servico, usuarios } = criarServico(criarDetalhe({ status: 'CONFIRMADA' }));
      const aula = await servico.obterDetalhe(aluno, 'a1');
      expect(usuarios.obterContato).toHaveBeenCalledWith('u-prof');
      expect(aula.contato).toEqual({
        nome: 'Ana',
        email: 'outro@exemplo.com',
        telefone: '61999990000',
      });
    });

    it('revela ao professor o contato do aluno depois da confirmacao', async () => {
      const { servico, usuarios } = criarServico(criarDetalhe({ status: 'REMARCADA' }));
      const aula = await servico.obterDetalhe(professorUsuario, 'a1');
      expect(usuarios.obterContato).toHaveBeenCalledWith('u-aluno');
      expect(aula.contato?.nome).toBe('Caio');
    });

    it('nega o acesso a quem nao participa da aula com 403', async () => {
      const { servico } = criarServico();
      const outroAluno = await capturarErro(
        servico.obterDetalhe({ id: 'outro', perfil: 'ALUNO' }, 'a1'),
      );
      expect(outroAluno).toBeInstanceOf(ErroProibido);
      const outroProfessor = await capturarErro(
        servico.obterDetalhe({ id: 'outro', perfil: 'PROFESSOR' }, 'a1'),
      );
      expect(outroProfessor).toBeInstanceOf(ErroProibido);
      const admin = await capturarErro(
        servico.obterDetalhe({ id: 'u-aluno', perfil: 'ADMIN' }, 'a1'),
      );
      expect(admin).toBeInstanceOf(ErroProibido);
    });

    it('responde 404 quando a aula nao existe', async () => {
      const { servico } = criarServico(null);
      expect(await capturarErro(servico.obterDetalhe(aluno, 'a9'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });
  });

  describe('aceitar', () => {
    it('confirma a aula, grava historico e notifica o aluno na mesma transacao', async () => {
      const { servico, repositorio, notificacoes, transacao } = criarServico();

      await servico.aceitar(professorUsuario, 'a1');

      expect(transacao).toHaveBeenCalledTimes(1);
      expect(repositorio.existeConflito).toHaveBeenCalledWith(
        tx,
        'p1',
        { inicio: INICIO, fim: FIM },
        'a1',
      );
      expect(repositorio.transicionar).toHaveBeenCalledWith(tx, {
        aulaId: 'a1',
        de: 'SOLICITADA',
        para: 'CONFIRMADA',
        autorId: 'u-prof',
      });
      expect(notificacoes.notificar).toHaveBeenCalledWith(tx, {
        usuarioId: 'u-aluno',
        aulaId: 'a1',
        tipo: 'CONFIRMACAO',
        mensagem: 'Ana confirmou a sua aula de Matemática em 09/11/2026 às 09:00.',
      });
    });

    it('responde 409 quando ja existe aula confirmada no horario (CT05)', async () => {
      const { servico, repositorio, notificacoes } = criarServico();
      repositorio.existeConflito.mockResolvedValue(true);

      const erro = await capturarErro(servico.aceitar(professorUsuario, 'a1'));

      expect(erro).toBeInstanceOf(ErroConflito);
      expect(erro.codigo).toBe('CONFLITO_DE_HORARIO');
      expect(repositorio.transicionar).not.toHaveBeenCalled();
      expect(notificacoes.notificar).not.toHaveBeenCalled();
    });

    it('propaga o conflito detectado pela restricao do banco e nao notifica', async () => {
      const { servico, repositorio, notificacoes } = criarServico();
      repositorio.transicionar.mockRejectedValue(
        new ErroConflito('Já existe uma aula confirmada neste horário', 'CONFLITO_DE_HORARIO'),
      );
      const erro = await capturarErro(servico.aceitar(professorUsuario, 'a1'));
      expect(erro.status).toBe(409);
      expect(notificacoes.notificar).not.toHaveBeenCalled();
    });

    it('nega a quem nao e o professor da aula com 403', async () => {
      const { servico, repositorio } = criarServico();
      expect(await capturarErro(servico.aceitar(aluno, 'a1'))).toBeInstanceOf(ErroProibido);
      expect(
        await capturarErro(servico.aceitar({ id: 'outro', perfil: 'PROFESSOR' }, 'a1')),
      ).toBeInstanceOf(ErroProibido);
      expect(repositorio.transicionar).not.toHaveBeenCalled();
    });

    it('rejeita transicao invalida com 400', async () => {
      for (const status of [
        'CONFIRMADA',
        'RECUSADA',
        'CANCELADA',
        'REALIZADA',
        'REMARCADA',
      ] as const) {
        const { servico, repositorio } = criarServico(criarDetalhe({ status }));
        const erro = await capturarErro(servico.aceitar(professorUsuario, 'a1'));
        expect(erro).toBeInstanceOf(ErroRegraNegocio);
        expect(erro.codigo).toBe('TRANSICAO_INVALIDA');
        expect(repositorio.transicionar).not.toHaveBeenCalled();
      }
    });

    it('rejeita a confirmacao de aula que ja passou com 400', async () => {
      const passada = criarDetalhe({
        inicio: criarDataBrasilia(2026, 11, 1, 9),
        fim: criarDataBrasilia(2026, 11, 1, 10),
      });
      const { servico } = criarServico(passada);
      const erro = await capturarErro(servico.aceitar(professorUsuario, 'a1'));
      expect(erro.codigo).toBe('AULA_NO_PASSADO');
    });

    it('responde 404 quando a aula nao existe', async () => {
      const { servico } = criarServico(null);
      expect(await capturarErro(servico.aceitar(professorUsuario, 'a9'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });
  });

  describe('recusar', () => {
    it('recusa com motivo, grava historico e notifica o aluno', async () => {
      const { servico, repositorio, notificacoes } = criarServico();

      await servico.recusar(professorUsuario, 'a1', 'Estarei viajando');

      expect(repositorio.transicionar).toHaveBeenCalledWith(tx, {
        aulaId: 'a1',
        de: 'SOLICITADA',
        para: 'RECUSADA',
        autorId: 'u-prof',
        motivo: 'Estarei viajando',
      });
      expect(notificacoes.notificar).toHaveBeenCalledWith(tx, {
        usuarioId: 'u-aluno',
        aulaId: 'a1',
        tipo: 'RECUSA',
        mensagem:
          'Ana recusou a sua aula de Matemática em 09/11/2026 às 09:00. Motivo: Estarei viajando',
      });
    });

    it('recusa sem motivo', async () => {
      const { servico, repositorio, notificacoes } = criarServico();
      await servico.recusar(professorUsuario, 'a1');
      expect(repositorio.transicionar).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ motivo: null }),
      );
      expect(notificacoes.notificar.mock.calls[0][1].mensagem).toBe(
        'Ana recusou a sua aula de Matemática em 09/11/2026 às 09:00.',
      );
    });

    it('rejeita recusa de aula que nao esta solicitada com 400 e de quem nao e dono com 403', async () => {
      const confirmada = criarServico(criarDetalhe({ status: 'CONFIRMADA' }));
      expect(await capturarErro(confirmada.servico.recusar(professorUsuario, 'a1'))).toBeInstanceOf(
        ErroRegraNegocio,
      );
      const { servico } = criarServico();
      expect(await capturarErro(servico.recusar(aluno, 'a1'))).toBeInstanceOf(ErroProibido);
    });
  });

  describe('listarIntervalosOcupados', () => {
    it('delega ao repositorio para alimentar a agenda', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.listarIntervalosOcupados.mockResolvedValue([{ inicio: INICIO, fim: FIM }]);
      expect(await servico.listarIntervalosOcupados('p1', AGORA, FIM)).toEqual([
        { inicio: INICIO, fim: FIM },
      ]);
      expect(repositorio.listarIntervalosOcupados).toHaveBeenCalledWith('p1', AGORA, FIM);
    });
  });
});
