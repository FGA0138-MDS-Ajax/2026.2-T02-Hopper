import type { FaixaHoraria, Intervalo } from '../types/dominio';

const DESLOCAMENTO_BRASILIA_HORAS = 3;
const MINUTOS_POR_HORA = 60;
const MS_POR_MINUTO = 60_000;
const MS_POR_DIA = 24 * 60 * MS_POR_MINUTO;

export const DURACAO_PADRAO_MINUTOS = 60;

export interface ComponentesDeData {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  diaSemana: number;
}

export function horaParaMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * MINUTOS_POR_HORA + minutos;
}

export function criarDataBrasilia(
  ano: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0,
): Date {
  return new Date(Date.UTC(ano, mes - 1, dia, hora + DESLOCAMENTO_BRASILIA_HORAS, minuto));
}

export function componentesBrasilia(data: Date): ComponentesDeData {
  const deslocada = new Date(data.getTime() - DESLOCAMENTO_BRASILIA_HORAS * 60 * MS_POR_MINUTO);
  return {
    ano: deslocada.getUTCFullYear(),
    mes: deslocada.getUTCMonth() + 1,
    dia: deslocada.getUTCDate(),
    hora: deslocada.getUTCHours(),
    minuto: deslocada.getUTCMinutes(),
    diaSemana: deslocada.getUTCDay(),
  };
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
    cursor = new Date(cursor.getTime() + MS_POR_DIA);
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
