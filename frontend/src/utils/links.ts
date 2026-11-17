import type { IntervaloApi } from '../services/professores';

/** Link para o formulário de solicitação, com o horário escolhido. */
export function linkParaSolicitar(professorId: string, horario: IntervaloApi): string {
  const parametros = new URLSearchParams({ inicio: horario.inicio, fim: horario.fim });
  return `/professores/${professorId}/solicitar?${parametros.toString()}`;
}
