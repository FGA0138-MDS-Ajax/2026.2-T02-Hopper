import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

/** Fuso de toda a aplicação (o mesmo do back-end e do banco): horário de Brasília. */
export const FUSO_BRASILIA = 'America/Sao_Paulo';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

type DataOuIso = Date | string;

function comoData(valor: DataOuIso): Date {
  return typeof valor === 'string' ? new Date(valor) : valor;
}

/** Meio-dia UTC de um dia "aaaa-mm-dd": serve para fazer contas de dia sem depender de fuso. */
function meioDiaUtc(chave: string): Date {
  return new Date(`${chave}T12:00:00Z`);
}

/** Dia (aaaa-mm-dd) em que o instante cai, no horário de Brasília. */
export function chaveDoDia(valor: DataOuIso): string {
  return formatInTimeZone(comoData(valor), FUSO_BRASILIA, 'yyyy-MM-dd');
}

/**
 * Instante (ISO 8601) de um dia "aaaa-mm-dd" e hora "HH:mm" de parede em Brasília.
 * Usa as regras do fuso America/Sao_Paulo, sem deslocamento fixo.
 */
export function instanteEmBrasilia(dia: string, horaDoDia: string): string {
  return fromZonedTime(`${dia}T${horaDoDia}:00`, FUSO_BRASILIA).toISOString();
}

/** Lista de dias consecutivos a partir de um dia "aaaa-mm-dd". */
export function diasConsecutivos(chaveInicial: string, quantidade: number): string[] {
  const base = meioDiaUtc(chaveInicial).getTime();
  return Array.from({ length: quantidade }, (_, indice) =>
    new Date(base + indice * MS_POR_DIA).toISOString().slice(0, 10),
  );
}

/** "14:00" no horário de Brasília. */
export function hora(valor: DataOuIso): string {
  return formatInTimeZone(comoData(valor), FUSO_BRASILIA, 'HH:mm');
}

/** "Seg" para um dia "aaaa-mm-dd". */
export function diaDaSemanaCurto(chave: string): string {
  const texto = formatInTimeZone(meioDiaUtc(chave), 'UTC', 'EEEE', { locale: ptBR }).slice(0, 3);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "12/11" para um dia "aaaa-mm-dd". */
export function diaMes(chave: string): string {
  return formatInTimeZone(meioDiaUtc(chave), 'UTC', 'dd/MM');
}

/** "nov" para um dia "aaaa-mm-dd". */
export function mesCurto(chave: string): string {
  return formatInTimeZone(meioDiaUtc(chave), 'UTC', 'MMM', { locale: ptBR }).replace('.', '');
}

/** "09/11 às 10h02" no horário de Brasília. */
export function dataHoraCurta(valor: DataOuIso): string {
  return `${diaMes(chaveDoDia(valor))} às ${horaCurta(valor)}`;
}

/** "14h" ou "14h30" no horário de Brasília. */
export function horaCurta(valor: DataOuIso): string {
  const [horas, minutos] = hora(valor).split(':');
  return `${Number(horas)}h${minutos === '00' ? '' : minutos}`;
}

/** "09 a 15 de novembro" ou, virando o mês, "30 de novembro a 06 de dezembro". */
export function intervaloDeDias(primeiro: string, ultimo: string): string {
  const mesmoMes = primeiro.slice(0, 7) === ultimo.slice(0, 7);
  const inicio = formatInTimeZone(meioDiaUtc(primeiro), 'UTC', mesmoMes ? 'dd' : "dd 'de' MMMM", { locale: ptBR });
  const fim = formatInTimeZone(meioDiaUtc(ultimo), 'UTC', "dd 'de' MMMM", { locale: ptBR });
  return `${inicio} a ${fim}`;
}

/** "quinta-feira, 12 de novembro" para um dia "aaaa-mm-dd". */
export function diaPorExtenso(chave: string): string {
  return formatInTimeZone(meioDiaUtc(chave), 'UTC', "EEEE, d 'de' MMMM", { locale: ptBR });
}

/** Agrupa intervalos pelo dia (no horário de Brasília) em que começam, em ordem. */
export function agruparPorDia<T extends { inicio: string }>(intervalos: T[]): Map<string, T[]> {
  const ordenados = [...intervalos].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const grupos = new Map<string, T[]>();
  for (const intervalo of ordenados) {
    const chave = chaveDoDia(intervalo.inicio);
    const lista = grupos.get(chave);
    if (lista) lista.push(intervalo);
    else grupos.set(chave, [intervalo]);
  }
  return grupos;
}
