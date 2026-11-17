import { api } from './api';
import type { Modalidade, ProfessorPublico } from './professores';

/** Perfil do próprio professor; "completo" indica se ele já aparece na busca. */
export interface MeuPerfil extends ProfessorPublico {
  completo: boolean;
}

export interface DadosPerfil {
  apresentacao: string;
  valorHora: number;
  modalidades: Modalidade[];
  materiaIds: string[];
}

/** Faixa da grade semanal: diaSemana 0 = domingo ... 6 = sábado; horas em "HH:mm" (Brasília). */
export interface FaixaHoraria {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

export interface Bloqueio {
  id: string;
  inicio: string;
  fim: string;
  motivo: string | null;
}

export async function obterMeuPerfil(): Promise<MeuPerfil> {
  const { data } = await api.get<MeuPerfil>('/professores/me');
  return data;
}

/** RF04 */
export async function salvarMeuPerfil(dados: DadosPerfil): Promise<MeuPerfil> {
  const { data } = await api.put<MeuPerfil>('/professores/me', dados);
  return data;
}

export async function obterGrade(): Promise<FaixaHoraria[]> {
  const { data } = await api.get<{ faixas: FaixaHoraria[] }>('/professores/me/disponibilidade');
  return data.faixas;
}

/** RF05: substitui a grade inteira pela enviada. */
export async function salvarGrade(faixas: FaixaHoraria[]): Promise<FaixaHoraria[]> {
  const { data } = await api.put<{ faixas: FaixaHoraria[] }>('/professores/me/disponibilidade', { faixas });
  return data.faixas;
}

/** Bloqueios que ainda vão acontecer. */
export async function listarBloqueios(): Promise<Bloqueio[]> {
  const { data } = await api.get<{ itens: Bloqueio[] }>('/professores/me/bloqueios');
  return data.itens;
}

/** RF06 */
export async function criarBloqueio(dados: { inicio: string; fim: string; motivo?: string }): Promise<Bloqueio> {
  const { data } = await api.post<Bloqueio>('/professores/me/bloqueios', dados);
  return data;
}

export async function removerBloqueio(id: string): Promise<void> {
  await api.delete(`/professores/me/bloqueios/${encodeURIComponent(id)}`);
}
