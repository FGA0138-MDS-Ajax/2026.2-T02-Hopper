import type { FaixaHoraria } from '../../services/area-professor';
import { diasConsecutivos, instanteEmBrasilia } from '../../utils/datas';

// Regras puras da área do professor, separadas dos componentes para serem testadas isoladamente.

/** Segunda a domingo (na API, 0 = domingo). */
export const DIAS = [
  { valor: 1, nome: 'Segunda-feira' },
  { valor: 2, nome: 'Terça-feira' },
  { valor: 3, nome: 'Quarta-feira' },
  { valor: 4, nome: 'Quinta-feira' },
  { valor: 5, nome: 'Sexta-feira' },
  { valor: 6, nome: 'Sábado' },
  { valor: 0, nome: 'Domingo' },
];

/** "08:30" → 510. */
export function minutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** RF05: erros por dia: hora vazia, início depois do fim ou faixas sobrepostas. */
export function validarGrade(faixas: FaixaHoraria[]): Map<number, string> {
  const erros = new Map<number, string>();
  for (const dia of DIAS) {
    const doDia = faixas
      .filter((faixa) => faixa.diaSemana === dia.valor)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    if (doDia.some((faixa) => !faixa.horaInicio || !faixa.horaFim)) {
      erros.set(dia.valor, 'Preencha o início e o fim de cada horário.');
    } else if (doDia.some((faixa) => minutos(faixa.horaInicio) >= minutos(faixa.horaFim))) {
      erros.set(dia.valor, 'O início precisa ser antes do fim.');
    } else if (doDia.some((faixa, i) => i > 0 && minutos(faixa.horaInicio) < minutos(doDia[i - 1].horaFim))) {
      erros.set(dia.valor, 'Os horários deste dia se sobrepõem.');
    }
  }
  return erros;
}

/** RF04: "90", "90,50", "R$ 1.200,00" → número; texto inválido → NaN. */
export function lerValorEmReais(texto: string): number {
  let limpo = texto.replace(/R\$|\s/g, '');
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.');
  return limpo === '' ? Number.NaN : Number(limpo);
}

/** RF06: período do bloqueio a partir do formulário, no horário de Brasília. Dia inteiro vai até a meia-noite seguinte. */
export function periodoDoBloqueio(dados: {
  dataInicio: string;
  dataFim: string;
  diaInteiro: boolean;
  horaInicio: string;
  horaFim: string;
}): { inicio: string; fim: string } {
  if (dados.diaInteiro) {
    const diaSeguinte = diasConsecutivos(dados.dataFim, 2)[1];
    return { inicio: instanteEmBrasilia(dados.dataInicio, '00:00'), fim: instanteEmBrasilia(diaSeguinte, '00:00') };
  }
  return {
    inicio: instanteEmBrasilia(dados.dataInicio, dados.horaInicio),
    fim: instanteEmBrasilia(dados.dataFim, dados.horaFim),
  };
}
