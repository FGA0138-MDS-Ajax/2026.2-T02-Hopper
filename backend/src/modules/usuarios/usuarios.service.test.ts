import { capturarErro } from '../../../tests/helpers/erros';
import { ErroNaoEncontrado, ErroValidacao } from '../../shared/errors';
import { criarDataBrasilia } from '../../shared/utils/datas';
import type { ProfessorDados, UsuariosRepositorio } from './usuarios.repository';
import { UsuariosService, type ProvedorDeHorariosLivres } from './usuarios.service';

const AGORA = criarDataBrasilia(2026, 11, 6, 10, 0);

const professorCompleto: ProfessorDados = {
  id: 'p1',
  usuarioId: 'u1',
  nome: 'Ana',
  ativo: true,
  apresentacao: 'Professora de matemática',
  valorHora: 80,
  modalidades: ['ONLINE'],
  materias: [{ id: 'm1', nome: 'Matemática', nivel: 'Médio' }],
};

function criarRepositorio(): jest.Mocked<UsuariosRepositorio> {
  return {
    buscarProfessores: jest.fn().mockResolvedValue({ itens: [], total: 0 }),
    buscarProfessorPorId: jest.fn().mockResolvedValue(professorCompleto),
    buscarProfessorPorUsuario: jest.fn().mockResolvedValue(professorCompleto),
    atualizarPerfilProfessor: jest.fn().mockResolvedValue(professorCompleto),
    contarMateriasExistentes: jest.fn().mockResolvedValue(1),
    listarMaterias: jest.fn().mockResolvedValue([]),
    buscarUsuarioPorId: jest.fn().mockResolvedValue({
      id: 'u1',
      nome: 'Ana',
      email: 'ana@exemplo.com',
      telefone: '61999990000',
      perfil: 'PROFESSOR',
      ativo: true,
    }),
    atualizarUsuario: jest.fn(),
  };
}

function criarServico(repositorio = criarRepositorio()) {
  const horarios: jest.Mocked<ProvedorDeHorariosLivres> = {
    calcularHorariosLivres: jest.fn().mockResolvedValue([]),
  };
  const servico = new UsuariosService({ repositorio, horarios, agora: () => AGORA });
  return { servico, repositorio, horarios };
}

describe('UsuariosService', () => {
  describe('buscarProfessores', () => {
    it('repassa filtros e paginacao e devolve a pagina sem expor dados de contato', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.buscarProfessores.mockResolvedValue({ itens: [professorCompleto], total: 11 });

      const pagina = await servico.buscarProfessores({
        materia: 'mat',
        nivel: undefined,
        modalidade: 'ONLINE',
        pagina: 2,
        limite: 5,
      });

      expect(repositorio.buscarProfessores).toHaveBeenCalledWith(
        { materia: 'mat', nivel: undefined, modalidade: 'ONLINE' },
        { pagina: 2, limite: 5, pular: 5 },
      );
      expect(pagina.total).toBe(11);
      expect(pagina.pagina).toBe(2);
      expect(Object.keys(pagina.itens[0]).sort()).toEqual([
        'apresentacao',
        'id',
        'materias',
        'modalidades',
        'nome',
        'valorHora',
      ]);
    });
  });

  describe('obterProfessorPublico', () => {
    it('devolve perfil com horarios livres das proximas semanas', async () => {
      const { servico, horarios } = criarServico();
      const livres = [{ inicio: AGORA, fim: AGORA }];
      horarios.calcularHorariosLivres.mockResolvedValue(livres);

      const perfil = await servico.obterProfessorPublico('p1');

      const [professorId, de, ate] = horarios.calcularHorariosLivres.mock.calls[0];
      expect(professorId).toBe('p1');
      expect(de).toEqual(AGORA);
      expect(ate.getTime() - de.getTime()).toBe(28 * 24 * 60 * 60 * 1000);
      expect(perfil.horariosLivres).toEqual(livres);
    });

    it('responde 404 para professor inexistente, bloqueado ou com perfil incompleto', async () => {
      const { servico, repositorio } = criarServico();

      repositorio.buscarProfessorPorId.mockResolvedValue(null);
      expect(await capturarErro(servico.obterProfessorPublico('p1'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );

      repositorio.buscarProfessorPorId.mockResolvedValue({ ...professorCompleto, ativo: false });
      expect(await capturarErro(servico.obterProfessorPublico('p1'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );

      repositorio.buscarProfessorPorId.mockResolvedValue({ ...professorCompleto, valorHora: null });
      expect(await capturarErro(servico.obterProfessorPublico('p1'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );

      repositorio.buscarProfessorPorId.mockResolvedValue({ ...professorCompleto, materias: [] });
      expect(await capturarErro(servico.obterProfessorPublico('p1'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );

      repositorio.buscarProfessorPorId.mockResolvedValue({
        ...professorCompleto,
        modalidades: [],
      });
      expect(await capturarErro(servico.obterProfessorPublico('p1'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );

      repositorio.buscarProfessorPorId.mockResolvedValue({
        ...professorCompleto,
        apresentacao: '   ',
      });
      expect(await capturarErro(servico.obterProfessorPublico('p1'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });
  });

  describe('perfil proprio', () => {
    it('indica se o perfil esta completo', async () => {
      const { servico, repositorio } = criarServico();
      expect((await servico.obterPerfilProprio('u1')).completo).toBe(true);

      repositorio.buscarProfessorPorUsuario.mockResolvedValue({
        ...professorCompleto,
        apresentacao: '',
        valorHora: null,
        modalidades: [],
        materias: [],
      });
      expect((await servico.obterPerfilProprio('u1')).completo).toBe(false);
    });

    it('responde 404 quando o usuario nao e professor', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.buscarProfessorPorUsuario.mockResolvedValue(null);
      expect(await capturarErro(servico.obterPerfilProprio('u1'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });

    it('atualiza o perfil quando todas as materias existem', async () => {
      const { servico, repositorio } = criarServico();
      const entrada = {
        apresentacao: 'Nova apresentação',
        valorHora: 90,
        modalidades: ['ONLINE' as const],
        materiaIds: ['m1'],
      };

      const perfil = await servico.atualizarPerfilProprio('u1', entrada);

      expect(repositorio.contarMateriasExistentes).toHaveBeenCalledWith(['m1']);
      expect(repositorio.atualizarPerfilProfessor).toHaveBeenCalledWith('p1', entrada);
      expect(perfil.completo).toBe(true);
    });

    it('rejeita materia inexistente com 422 e nao grava', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.contarMateriasExistentes.mockResolvedValue(1);
      const erro = await capturarErro(
        servico.atualizarPerfilProprio('u1', {
          apresentacao: 'x',
          valorHora: 50,
          modalidades: ['ONLINE'],
          materiaIds: ['m1', 'm2'],
        }),
      );
      expect(erro).toBeInstanceOf(ErroValidacao);
      expect(erro.codigo).toBe('MATERIA_INEXISTENTE');
      expect(repositorio.atualizarPerfilProfessor).not.toHaveBeenCalled();
    });
  });

  describe('usuario', () => {
    it('atualiza nome e telefone e devolve somente dados publicos', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.atualizarUsuario.mockResolvedValue({
        id: 'u1',
        nome: 'Ana Maria',
        email: 'ana@exemplo.com',
        telefone: null,
        perfil: 'PROFESSOR',
        ativo: true,
      });

      const resultado = await servico.atualizarUsuario('u1', { nome: 'Ana Maria', telefone: null });

      expect(repositorio.atualizarUsuario).toHaveBeenCalledWith('u1', {
        nome: 'Ana Maria',
        telefone: null,
      });
      expect(resultado).toEqual({
        id: 'u1',
        nome: 'Ana Maria',
        email: 'ana@exemplo.com',
        telefone: null,
        perfil: 'PROFESSOR',
      });
    });

    it('responde 404 ao atualizar usuario inexistente', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.buscarUsuarioPorId.mockResolvedValue(null);
      expect(await capturarErro(servico.atualizarUsuario('u9', { nome: 'Xx' }))).toBeInstanceOf(
        ErroNaoEncontrado,
      );
      expect(repositorio.atualizarUsuario).not.toHaveBeenCalled();
    });

    it('obtem o contato de um usuario e falha quando ele nao existe', async () => {
      const { servico, repositorio } = criarServico();
      expect(await servico.obterContato('u1')).toEqual({
        email: 'ana@exemplo.com',
        telefone: '61999990000',
      });
      repositorio.buscarUsuarioPorId.mockResolvedValue(null);
      expect(await capturarErro(servico.obterContato('u9'))).toBeInstanceOf(ErroNaoEncontrado);
    });
  });

  describe('servicos expostos para outros modulos', () => {
    it('obtem os dados do professor necessarios para uma aula', async () => {
      const { servico } = criarServico();
      expect(await servico.obterProfessorParaAula('p1')).toEqual({
        id: 'p1',
        usuarioId: 'u1',
        nome: 'Ana',
        ativo: true,
        modalidades: ['ONLINE'],
        materiaIds: ['m1'],
      });
    });

    it('responde 404 quando o professor da aula nao existe', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.buscarProfessorPorId.mockResolvedValue(null);
      expect(await capturarErro(servico.obterProfessorParaAula('p9'))).toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });

    it('converte o id do usuario no id do perfil de professor', async () => {
      const { servico } = criarServico();
      expect(await servico.obterProfessorIdPorUsuario('u1')).toBe('p1');
    });

    it('lista as materias', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.listarMaterias.mockResolvedValue([{ id: 'm1', nome: 'Física', nivel: 'Médio' }]);
      expect(await servico.listarMaterias()).toHaveLength(1);
    });
  });
});
