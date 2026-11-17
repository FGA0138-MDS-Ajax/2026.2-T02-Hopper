import { api } from './api';

export type Modalidade = 'ONLINE' | 'PRESENCIAL' | 'DOMICILIO';

export const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  ONLINE: 'Online',
  PRESENCIAL: 'Presencial',
  DOMICILIO: 'Em domicílio',
};

/** Níveis usados no filtro enquanto a lista de matérias não chega da API (ou se ela falhar). */
export const NIVEIS_PADRAO = ['Ensino Fundamental', 'Ensino Médio', 'Pré-vestibular / ENEM', 'Ensino Superior'];

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

/** Intervalo vindo da API: datas em ISO 8601 no horário de Brasília (ex.: "2026-11-10T08:00:00.000-03:00"). */
export interface IntervaloApi {
  inicio: string;
  fim: string;
}

export interface ProfessorDetalhe extends ProfessorPublico {
  /** Blocos livres das próximas semanas, já sem bloqueios e aulas confirmadas. */
  horariosLivres: IntervaloApi[];
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

export async function buscarProfessor(id: string): Promise<ProfessorDetalhe> {
  const { data } = await api.get<ProfessorDetalhe>(`/professores/${encodeURIComponent(id)}`);
  return data;
}

export async function listarMaterias(): Promise<Materia[]> {
  const { data } = await api.get<{ itens: Materia[] }>('/materias');
  return data.itens;
}
