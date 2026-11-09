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
}

/** RF09: o aluno solicita a aula; ela nasce com o status "Solicitada" e o professor é notificado. */
export async function solicitarAula(dados: DadosSolicitacao): Promise<Aula[]> {
  const { data } = await api.post<{ itens: Aula[] }>('/aulas', dados);
  return data.itens;
}
