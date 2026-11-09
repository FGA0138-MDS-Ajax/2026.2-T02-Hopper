import { describe, expect, it } from 'vitest';
import {
  agruparPorDia,
  chaveDoDia,
  diaDaSemanaCurto,
  diaMes,
  diaPorExtenso,
  diasConsecutivos,
  hora,
  horaCurta,
  intervaloDeDias,
} from './datas';

describe('datas no horário de Brasília', () => {
  it('converte UTC para o horário de Brasília', () => {
    expect(hora('2026-11-12T17:00:00.000Z')).toBe('14:00');
  });

  it('usa o dia de Brasília, mesmo quando em UTC já é o dia seguinte', () => {
    // 01:30 UTC do dia 13 ainda é 22:30 do dia 12 em Brasília.
    expect(chaveDoDia('2026-11-13T01:30:00.000Z')).toBe('2026-11-12');
  });

  it('gera dias consecutivos atravessando a virada do mês', () => {
    expect(diasConsecutivos('2026-11-29', 4)).toEqual(['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02']);
  });

  it('formata os rótulos dos dias', () => {
    expect(diaDaSemanaCurto('2026-11-12')).toBe('Qui');
    expect(diaMes('2026-11-12')).toBe('12/11');
    expect(diaPorExtenso('2026-11-12')).toBe('quinta-feira, 12 de novembro');
  });

  it('formata hora curta e intervalo de dias', () => {
    expect(horaCurta('2026-11-12T14:00:00.000-03:00')).toBe('14h');
    expect(horaCurta('2026-11-12T08:30:00.000-03:00')).toBe('8h30');
    expect(intervaloDeDias('2026-11-09', '2026-11-15')).toBe('09 a 15 de novembro');
    expect(intervaloDeDias('2026-11-30', '2026-12-06')).toBe('30 de novembro a 06 de dezembro');
  });

  it('agrupa intervalos por dia, em ordem', () => {
    const grupos = agruparPorDia([
      { inicio: '2026-11-12T18:00:00.000Z' },
      { inicio: '2026-11-10T11:00:00.000Z' },
      { inicio: '2026-11-12T11:00:00.000Z' },
    ]);
    expect([...grupos.keys()]).toEqual(['2026-11-10', '2026-11-12']);
    expect(grupos.get('2026-11-12')?.map((item) => hora(item.inicio))).toEqual(['08:00', '15:00']);
  });
});
