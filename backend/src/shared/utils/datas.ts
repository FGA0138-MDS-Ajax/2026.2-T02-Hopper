import type { FaixaHoraria, Intervalo } from '../types/dominio';

/** Fuso de toda a aplicação: datas são lidas, calculadas e devolvidas no horário de Brasília. */
export const FUSO_HORARIO = 'America/Sao_Paulo';

const MINUTOS_POR_HORA = 60;
const MS_POR_MINUTO = 60_000;

export const DURACAO_PADRAO_MINUTOS = 60;

export interface ComponentesDeData {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  diaSemana: number;
}

const DIAS_DA_SEMANA: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatadorDoFuso = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO_HORARIO,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
});

/** Componentes de calendário do instante no fuso da aplicação (via Intl, sem deslocamento fixo). */
function partesNoFuso(data: Date): ComponentesDeData & { segundo: number } {
  const partes: Record<string, string> = {};
  for (const parte of formatadorDoFuso.formatToParts(data)) partes[parte.type] = parte.value;
  return {
    ano: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    hora: Number(partes.hour),
    minuto: Number(partes.minute),
    segundo: Number(partes.second),
    diaSemana: DIAS_DA_SEMANA[partes.weekday],
  };
}

/** Diferença, em minutos, entre o horário do fuso e o UTC naquele instante (Brasília: -180). */
export function deslocamentoDoFusoEmMinutos(data: Date): number {
  const partes = partesNoFuso(data);
  const comoSeFosseUtc = Date.UTC(
    partes.ano,
    partes.mes - 1,
    partes.dia,
    partes.hora,
    partes.minuto,
    partes.segundo,
  );
  const instanteSemMilissegundos = data.getTime() - data.getUTCMilliseconds();
  return Math.round((comoSeFosseUtc - instanteSemMilissegundos) / MS_POR_MINUTO);
}

export function horaParaMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * MINUTOS_POR_HORA + minutos;
}

/**
 * Instante correspondente a uma data e hora "de parede" em Brasília.
 * Aceita dia ou hora fora do intervalo (ex.: dia 32) e normaliza, como o Date.UTC.
 */
export function criarDataBrasilia(
  ano: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0,
): Date {
  const comoSeFosseUtc = Date.UTC(ano, mes - 1, dia, hora, minuto);
  // Duas passagens: a segunda corrige o caso raro em que o deslocamento muda entre
  // o palpite e o instante final (ex.: se o país voltar a adotar horário de verão).
  let instante =
    comoSeFosseUtc - deslocamentoDoFusoEmMinutos(new Date(comoSeFosseUtc)) * MS_POR_MINUTO;
  instante = comoSeFosseUtc - deslocamentoDoFusoEmMinutos(new Date(instante)) * MS_POR_MINUTO;
  return new Date(instante);
}

export function componentesBrasilia(data: Date): ComponentesDeData {
  const { ano, mes, dia, hora, minuto, diaSemana } = partesNoFuso(data);
  return { ano, mes, dia, hora, minuto, diaSemana };
}

function preencher(numero: number, digitos = 2): string {
  return String(Math.abs(numero)).padStart(digitos, '0');
}

/** ISO 8601 com o deslocamento de Brasília, ex.: "2026-11-10T08:00:00.000-03:00". */
export function formatarIsoBrasilia(data: Date): string {
  const partes = partesNoFuso(data);
  const deslocamento = deslocamentoDoFusoEmMinutos(data);
  const sinal = deslocamento < 0 ? '-' : '+';
  const horasDesl = Math.floor(Math.abs(deslocamento) / MINUTOS_POR_HORA);
  const minutosDesl = Math.abs(deslocamento) % MINUTOS_POR_HORA;
  return (
    `${partes.ano}-${preencher(partes.mes)}-${preencher(partes.dia)}` +
    `T${preencher(partes.hora)}:${preencher(partes.minuto)}:${preencher(partes.segundo)}` +
    `.${preencher(data.getUTCMilliseconds(), 3)}${sinal}${preencher(horasDesl)}:${preencher(minutosDesl)}`
  );
}

/**
 * "Replacer" do JSON das respostas: toda data sai no horário de Brasília (ex.: "...T08:00:00.000-03:00").
 * O JSON.stringify chama toJSON antes do replacer, então o valor original é lido do objeto que o contém.
 */
export function serializarDatasNoFuso(this: unknown, chave: string, valor: unknown): unknown {
  const original = (this as Record<string, unknown>)[chave];
  if (original instanceof Date && !Number.isNaN(original.getTime())) {
    return formatarIsoBrasilia(original);
  }
  return valor;
}

export function somarMinutos(data: Date, minutos: number): Date {
  return new Date(data.getTime() + minutos * MS_POR_MINUTO);
}

export function intervalosSobrepoem(a: Intervalo, b: Intervalo): boolean {
  return a.inicio.getTime() < b.fim.getTime() && b.inicio.getTime() < a.fim.getTime();
}

export function faixasSeSobrepoem(faixas: FaixaHoraria[]): boolean {
  const porDia = new Map<number, FaixaHoraria[]>();
  for (const faixa of faixas) {
    porDia.set(faixa.diaSemana, [...(porDia.get(faixa.diaSemana) ?? []), faixa]);
  }
  for (const doDia of porDia.values()) {
    const ordenadas = [...doDia].sort(
      (a, b) => horaParaMinutos(a.horaInicio) - horaParaMinutos(b.horaInicio),
    );
    for (let i = 1; i < ordenadas.length; i += 1) {
      if (horaParaMinutos(ordenadas[i].horaInicio) < horaParaMinutos(ordenadas[i - 1].horaFim)) {
        return true;
      }
    }
  }
  return false;
}

export interface ParametrosHorariosLivres {
  grade: FaixaHoraria[];
  bloqueios: Intervalo[];
  ocupados: Intervalo[];
  de: Date;
  ate: Date;
  agora: Date;
  duracaoMinutos?: number;
}

export function gerarHorariosLivres(parametros: ParametrosHorariosLivres): Intervalo[] {
  const duracao = parametros.duracaoMinutos ?? DURACAO_PADRAO_MINUTOS;
  const impedimentos = [...parametros.bloqueios, ...parametros.ocupados];
  const livres: Intervalo[] = [];
  const primeiro = componentesBrasilia(parametros.de);
  let cursor = criarDataBrasilia(primeiro.ano, primeiro.mes, primeiro.dia);
  while (cursor.getTime() < parametros.ate.getTime()) {
    const dia = componentesBrasilia(cursor);
    for (const faixa of parametros.grade.filter((item) => item.diaSemana === dia.diaSemana)) {
      const fimFaixa = horaParaMinutos(faixa.horaFim);
      for (
        let minuto = horaParaMinutos(faixa.horaInicio);
        minuto + duracao <= fimFaixa;
        minuto += duracao
      ) {
        const inicio = criarDataBrasilia(
          dia.ano,
          dia.mes,
          dia.dia,
          Math.floor(minuto / MINUTOS_POR_HORA),
          minuto % MINUTOS_POR_HORA,
        );
        const candidato = { inicio, fim: somarMinutos(inicio, duracao) };
        const dentroDaJanela =
          inicio.getTime() >= parametros.de.getTime() &&
          candidato.fim.getTime() <= parametros.ate.getTime() &&
          inicio.getTime() > parametros.agora.getTime();
        if (dentroDaJanela && !impedimentos.some((item) => intervalosSobrepoem(candidato, item))) {
          livres.push(candidato);
        }
      }
    }
    // Avança pelo calendário (próximo dia à meia-noite em Brasília), não por 24 h fixas.
    cursor = criarDataBrasilia(dia.ano, dia.mes, dia.dia + 1);
  }
  return livres.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

export function intervaloCabeNaGrade(grade: FaixaHoraria[], intervalo: Intervalo): boolean {
  const inicio = componentesBrasilia(intervalo.inicio);
  const fim = componentesBrasilia(intervalo.fim);
  if (inicio.ano !== fim.ano || inicio.mes !== fim.mes || inicio.dia !== fim.dia) return false;
  const minutoInicio = inicio.hora * MINUTOS_POR_HORA + inicio.minuto;
  const minutoFim = fim.hora * MINUTOS_POR_HORA + fim.minuto;
  return grade.some(
    (faixa) =>
      faixa.diaSemana === inicio.diaSemana &&
      horaParaMinutos(faixa.horaInicio) <= minutoInicio &&
      minutoFim <= horaParaMinutos(faixa.horaFim),
  );
}

function doisDigitos(numero: number): string {
  return String(numero).padStart(2, '0');
}

export function formatarDataHoraBrasilia(data: Date): string {
  const componentes = componentesBrasilia(data);
  const dataTexto = `${doisDigitos(componentes.dia)}/${doisDigitos(componentes.mes)}/${componentes.ano}`;
  return `${dataTexto} às ${doisDigitos(componentes.hora)}:${doisDigitos(componentes.minuto)}`;
}
