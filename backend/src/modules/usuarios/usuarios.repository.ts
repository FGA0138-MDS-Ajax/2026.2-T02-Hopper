import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma';
import type { Modalidade, Paginacao, Perfil } from '../../shared/types/dominio';

export interface MateriaDados {
  id: string;
  nome: string;
  nivel: string;
}

export interface ProfessorDados {
  id: string;
  usuarioId: string;
  nome: string;
  ativo: boolean;
  apresentacao: string;
  valorHora: number | null;
  modalidades: Modalidade[];
  materias: MateriaDados[];
}

export interface UsuarioDados {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: Perfil;
  ativo: boolean;
}

export interface FiltrosBuscaProfessores {
  materia?: string;
  nivel?: string;
  modalidade?: Modalidade;
}

export interface DadosPerfilProfessor {
  apresentacao: string;
  valorHora: number;
  modalidades: Modalidade[];
  materiaIds: string[];
}

export interface DadosUsuario {
  nome?: string;
  telefone?: string | null;
}

export interface ResultadoBuscaProfessores {
  itens: ProfessorDados[];
  total: number;
}

export interface UsuariosRepositorio {
  buscarProfessores(
    filtros: FiltrosBuscaProfessores,
    paginacao: Paginacao,
  ): Promise<ResultadoBuscaProfessores>;
  buscarProfessorPorId(professorId: string): Promise<ProfessorDados | null>;
  buscarProfessorPorUsuario(usuarioId: string): Promise<ProfessorDados | null>;
  atualizarPerfilProfessor(
    professorId: string,
    dados: DadosPerfilProfessor,
  ): Promise<ProfessorDados>;
  contarMateriasExistentes(ids: string[]): Promise<number>;
  listarMaterias(): Promise<MateriaDados[]>;
  buscarUsuarioPorId(id: string): Promise<UsuarioDados | null>;
  atualizarUsuario(id: string, dados: DadosUsuario): Promise<UsuarioDados>;
}

const inclusaoProfessor = {
  usuario: { select: { nome: true, ativo: true } },
  materias: {
    select: { id: true, nome: true, nivel: true },
    orderBy: [{ nome: 'asc' }, { nivel: 'asc' }],
  },
} satisfies Prisma.PerfilProfessorInclude;

type RegistroProfessor = Prisma.PerfilProfessorGetPayload<{ include: typeof inclusaoProfessor }>;

const selecaoUsuario = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  perfil: true,
  ativo: true,
} as const;

function paraProfessorDados(registro: RegistroProfessor): ProfessorDados {
  return {
    id: registro.id,
    usuarioId: registro.usuarioId,
    nome: registro.usuario.nome,
    ativo: registro.usuario.ativo,
    apresentacao: registro.apresentacao,
    valorHora: registro.valorHora ? registro.valorHora.toNumber() : null,
    modalidades: registro.modalidades,
    materias: registro.materias,
  };
}

function montarFiltro(filtros: FiltrosBuscaProfessores): Prisma.PerfilProfessorWhereInput {
  const filtroMateria: Prisma.MateriaWhereInput = {};
  if (filtros.materia) filtroMateria.nome = { contains: filtros.materia, mode: 'insensitive' };
  if (filtros.nivel) filtroMateria.nivel = { contains: filtros.nivel, mode: 'insensitive' };
  return {
    usuario: { ativo: true },
    apresentacao: { not: '' },
    valorHora: { not: null },
    modalidades: filtros.modalidade ? { has: filtros.modalidade } : { isEmpty: false },
    materias: { some: filtroMateria },
  };
}

export class UsuariosRepositorioPrisma implements UsuariosRepositorio {
  async buscarProfessores(
    filtros: FiltrosBuscaProfessores,
    paginacao: Paginacao,
  ): Promise<ResultadoBuscaProfessores> {
    const where = montarFiltro(filtros);
    const [registros, total] = await Promise.all([
      prisma.perfilProfessor.findMany({
        where,
        include: inclusaoProfessor,
        orderBy: [{ usuario: { nome: 'asc' } }, { id: 'asc' }],
        skip: paginacao.pular,
        take: paginacao.limite,
      }),
      prisma.perfilProfessor.count({ where }),
    ]);
    return { itens: registros.map(paraProfessorDados), total };
  }

  async buscarProfessorPorId(professorId: string): Promise<ProfessorDados | null> {
    const registro = await prisma.perfilProfessor.findUnique({
      where: { id: professorId },
      include: inclusaoProfessor,
    });
    return registro ? paraProfessorDados(registro) : null;
  }

  async buscarProfessorPorUsuario(usuarioId: string): Promise<ProfessorDados | null> {
    const registro = await prisma.perfilProfessor.findUnique({
      where: { usuarioId },
      include: inclusaoProfessor,
    });
    return registro ? paraProfessorDados(registro) : null;
  }

  async atualizarPerfilProfessor(
    professorId: string,
    dados: DadosPerfilProfessor,
  ): Promise<ProfessorDados> {
    const registro = await prisma.perfilProfessor.update({
      where: { id: professorId },
      data: {
        apresentacao: dados.apresentacao,
        valorHora: dados.valorHora,
        modalidades: dados.modalidades,
        materias: { set: dados.materiaIds.map((id) => ({ id })) },
      },
      include: inclusaoProfessor,
    });
    return paraProfessorDados(registro);
  }

  contarMateriasExistentes(ids: string[]): Promise<number> {
    return prisma.materia.count({ where: { id: { in: ids } } });
  }

  listarMaterias(): Promise<MateriaDados[]> {
    return prisma.materia.findMany({
      select: { id: true, nome: true, nivel: true },
      orderBy: [{ nome: 'asc' }, { nivel: 'asc' }],
    });
  }

  buscarUsuarioPorId(id: string): Promise<UsuarioDados | null> {
    return prisma.usuario.findUnique({ where: { id }, select: selecaoUsuario });
  }

  atualizarUsuario(id: string, dados: DadosUsuario): Promise<UsuarioDados> {
    return prisma.usuario.update({ where: { id }, data: dados, select: selecaoUsuario });
  }
}
