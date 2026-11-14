import { api } from './api';
import type { Modalidade } from './professores';

export type StatusAula = 'SOLICITADA' | 'CONFIRMADA' | 'RECUSADA' | 'REMARCADA' | 'CANCELADA' | 'REALIZADA';

export const ROTULO_STATUS: Record<StatusAula, string> = {
  SOLICITADA: 'Solicitada',
  CONFIRMADA: 'Confirmada',
  RECUSADA: 'Recusada',
  REMARCADA: 'Remarcada',
  CANCELADA: 'Cancelada',
  REALIZADA: 'Realizada',
};

/** Aula como a API devolve (datas em ISO 8601 no horário de Brasília). */
export interface Aula {
  id: string;
  inicio: string;
  fim: string;
  modalidade: Modalidade;
  objetivo: string | null;
  status: StatusAula;
  serieId: string | null;
  motivoCancelamento: string | null;
  criadoEm: string;
  materia: { id: string; nome: string; nivel: string };
  aluno: { id: string; nome: string };
  professor: { id: string; usuarioId: string; nome: string };
}

export interface DadosSolicitacao {
  professorId: string;
  materiaId: string;
  inicio: string;
  fim: string;
  modalidade: Modalidade;
  objetivo?: string;
  /** RF10: repete o pedido no mesmo dia e horário por 2 a 12 semanas. */
  recorrencia?: { semanas: number };
}

export interface AulaDetalhe extends Aula {
  anotacoes: string | null;
  historico: { status: StatusAula; dataHora: string; motivo: string | null; autorId: string | null }[];
  /** Contato do outro participante: só vem depois da confirmação (RNF06). */
  contato: { nome: string; email: string; telefone: string | null } | null;
}

export interface FiltrosAulas {
  status?: StatusAula;
  de?: string;
  ate?: string;
  pagina?: number;
  limite?: number;
}

export interface PaginaDeAulas {
  itens: Aula[];
  total: number;
  pagina: number;
}

/** RF17/RF18: aulas do usuário logado (do aluno ou do professor), da mais recente para a mais antiga. */
export async function listarAulas(filtros: FiltrosAulas): Promise<PaginaDeAulas> {
  const { data } = await api.get<PaginaDeAulas>('/aulas', { params: filtros });
  return data;
}

export async function obterAula(id: string): Promise<AulaDetalhe> {
  const { data } = await api.get<AulaDetalhe>(`/aulas/${encodeURIComponent(id)}`);
  return data;
}

/**
 * RF11/RF12: o professor aceita; a API confere conflito de horário dentro de uma transação e recusa
 * sozinha os outros pedidos para o mesmo horário. Com serie, confirma também as próximas aulas
 * pendentes da mesma série semanal (RF10), todas ou nenhuma.
 */
export async function aceitarAula(id: string, opcoes?: { serie: true }): Promise<AulaDetalhe> {
  const { data } = await api.patch<AulaDetalhe>(`/aulas/${encodeURIComponent(id)}/aceitar`, opcoes);
  return data;
}

export async function recusarAula(id: string, motivo?: string): Promise<AulaDetalhe> {
  const { data } = await api.patch<AulaDetalhe>(`/aulas/${encodeURIComponent(id)}/recusar`, motivo ? { motivo } : {});
  return data;
}

/**
 * RF09: o aluno solicita a aula; ela nasce com o status "Solicitada" e o professor é notificado.
 * RF10: com recorrência, a API cria uma aula por semana (mesmo serieId) ou nenhuma, se alguma semana estiver ocupada.
 */
export async function solicitarAula(dados: DadosSolicitacao): Promise<Aula[]> {
  const { data } = await api.post<{ itens: Aula[] }>('/aulas', dados);
  return data.itens;
}
