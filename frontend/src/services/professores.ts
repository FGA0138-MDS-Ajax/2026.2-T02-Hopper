import { api } from './api';

export type Modalidade = 'ONLINE' | 'PRESENCIAL' | 'DOMICILIO';

export const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  ONLINE: 'Online',
  PRESENCIAL: 'Presencial',
  DOMICILIO: 'Em domicílio',
};

export interface Materia {
  id: string;
  nome: string;
  nivel: string;
}

export interface ProfessorPublico {
  id: string;
  nome: string;
  apresentacao: string;
  valorHora: number | null;
  modalidades: Modalidade[];
  materias: Materia[];
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
}

export interface FiltrosBusca {
  materia?: string;
  nivel?: string;
  modalidade?: Modalidade;
  pagina?: number;
  limite?: number;
}

export async function buscarProfessores(filtros: FiltrosBusca): Promise<Pagina<ProfessorPublico>> {
  const { data } = await api.get<Pagina<ProfessorPublico>>('/professores', { params: filtros });
  return data;
}

export async function listarMaterias(): Promise<Materia[]> {
  const { data } = await api.get<{ itens: Materia[] }>('/materias');
  return data.itens;
}
