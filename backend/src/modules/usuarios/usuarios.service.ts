import { ErroNaoEncontrado, ErroValidacao } from '../../shared/errors';
import type { Intervalo, Modalidade, Pagina, UsuarioPublico } from '../../shared/types/dominio';
import { calcularPaginacao, montarPagina } from '../../shared/utils/paginacao';
import type { MateriaDados, ProfessorDados, UsuariosRepositorio } from './usuarios.repository';
import type {
  EntradaAtualizarPerfilProfessor,
  EntradaAtualizarUsuario,
  EntradaBuscaProfessores,
} from './usuarios.schemas';

export interface ProvedorDeHorariosLivres {
  calcularHorariosLivres(professorId: string, de: Date, ate: Date): Promise<Intervalo[]>;
}

export interface DependenciasUsuariosService {
  repositorio: UsuariosRepositorio;
  horarios: ProvedorDeHorariosLivres;
  agora?: () => Date;
}

export interface ProfessorPublico {
  id: string;
  nome: string;
  apresentacao: string;
  valorHora: number | null;
  modalidades: Modalidade[];
  materias: MateriaDados[];
}

export interface ProfessorPublicoComHorarios extends ProfessorPublico {
  horariosLivres: Intervalo[];
}

export interface PerfilProfessorProprio extends ProfessorPublico {
  completo: boolean;
}

export interface ContatoUsuario {
  email: string;
  telefone: string | null;
}

export interface ProfessorParaAula {
  id: string;
  usuarioId: string;
  nome: string;
  ativo: boolean;
  modalidades: Modalidade[];
  materiaIds: string[];
}

const JANELA_DE_HORARIOS_EM_DIAS = 28;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function perfilEstaCompleto(professor: ProfessorDados): boolean {
  return (
    professor.apresentacao.trim() !== '' &&
    professor.valorHora !== null &&
    professor.modalidades.length > 0 &&
    professor.materias.length > 0
  );
}

function paraProfessorPublico(professor: ProfessorDados): ProfessorPublico {
  return {
    id: professor.id,
    nome: professor.nome,
    apresentacao: professor.apresentacao,
    valorHora: professor.valorHora,
    modalidades: professor.modalidades,
    materias: professor.materias,
  };
}

export class UsuariosService {
  constructor(private readonly deps: DependenciasUsuariosService) {}

  async buscarProfessores(consulta: EntradaBuscaProfessores): Promise<Pagina<ProfessorPublico>> {
    const { materia, nivel, modalidade, pagina, limite } = consulta;
    const resultado = await this.deps.repositorio.buscarProfessores(
      { materia, nivel, modalidade },
      calcularPaginacao({ pagina, limite }),
    );
    return montarPagina(resultado.itens.map(paraProfessorPublico), resultado.total, pagina);
  }

  async obterProfessorPublico(professorId: string): Promise<ProfessorPublicoComHorarios> {
    const professor = await this.deps.repositorio.buscarProfessorPorId(professorId);
    if (!professor || !professor.ativo || !perfilEstaCompleto(professor)) {
      throw new ErroNaoEncontrado('Professor não encontrado', 'PROFESSOR_NAO_ENCONTRADO');
    }
    const agora = this.agora();
    const ate = new Date(agora.getTime() + JANELA_DE_HORARIOS_EM_DIAS * MS_POR_DIA);
    const horariosLivres = await this.deps.horarios.calcularHorariosLivres(
      professor.id,
      agora,
      ate,
    );
    return { ...paraProfessorPublico(professor), horariosLivres };
  }

  async obterPerfilProprio(usuarioId: string): Promise<PerfilProfessorProprio> {
    const professor = await this.exigirProfessorDoUsuario(usuarioId);
    return { ...paraProfessorPublico(professor), completo: perfilEstaCompleto(professor) };
  }

  async atualizarPerfilProprio(
    usuarioId: string,
    entrada: EntradaAtualizarPerfilProfessor,
  ): Promise<PerfilProfessorProprio> {
    const professor = await this.exigirProfessorDoUsuario(usuarioId);
    const existentes = await this.deps.repositorio.contarMateriasExistentes(entrada.materiaIds);
    if (existentes !== entrada.materiaIds.length) {
      throw new ErroValidacao('Uma ou mais matérias não existem', null, 'MATERIA_INEXISTENTE');
    }
    const atualizado = await this.deps.repositorio.atualizarPerfilProfessor(professor.id, entrada);
    return { ...paraProfessorPublico(atualizado), completo: perfilEstaCompleto(atualizado) };
  }

  listarMaterias(): Promise<MateriaDados[]> {
    return this.deps.repositorio.listarMaterias();
  }

  async atualizarUsuario(
    usuarioId: string,
    entrada: EntradaAtualizarUsuario,
  ): Promise<UsuarioPublico> {
    await this.buscarPorId(usuarioId);
    const atualizado = await this.deps.repositorio.atualizarUsuario(usuarioId, entrada);
    return {
      id: atualizado.id,
      nome: atualizado.nome,
      email: atualizado.email,
      telefone: atualizado.telefone,
      perfil: atualizado.perfil,
    };
  }

  async buscarPorId(usuarioId: string): Promise<UsuarioPublico & { ativo: boolean }> {
    const usuario = await this.deps.repositorio.buscarUsuarioPorId(usuarioId);
    if (!usuario) throw new ErroNaoEncontrado('Usuário não encontrado', 'USUARIO_NAO_ENCONTRADO');
    return usuario;
  }

  async obterContato(usuarioId: string): Promise<ContatoUsuario> {
    const usuario = await this.buscarPorId(usuarioId);
    return { email: usuario.email, telefone: usuario.telefone };
  }

  async obterProfessorIdPorUsuario(usuarioId: string): Promise<string> {
    const professor = await this.exigirProfessorDoUsuario(usuarioId);
    return professor.id;
  }

  async obterProfessorParaAula(professorId: string): Promise<ProfessorParaAula> {
    const professor = await this.deps.repositorio.buscarProfessorPorId(professorId);
    if (!professor) {
      throw new ErroNaoEncontrado('Professor não encontrado', 'PROFESSOR_NAO_ENCONTRADO');
    }
    return {
      id: professor.id,
      usuarioId: professor.usuarioId,
      nome: professor.nome,
      ativo: professor.ativo,
      modalidades: professor.modalidades,
      materiaIds: professor.materias.map((materia) => materia.id),
    };
  }

  private async exigirProfessorDoUsuario(usuarioId: string): Promise<ProfessorDados> {
    const professor = await this.deps.repositorio.buscarProfessorPorUsuario(usuarioId);
    if (!professor) {
      throw new ErroNaoEncontrado('Perfil de professor não encontrado', 'PROFESSOR_NAO_ENCONTRADO');
    }
    return professor;
  }

  private agora(): Date {
    return this.deps.agora ? this.deps.agora() : new Date();
  }
}
