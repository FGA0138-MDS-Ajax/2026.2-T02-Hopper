import {
  componentesBrasilia,
  criarDataBrasilia,
  faixasSeSobrepoem,
  deslocamentoDoFusoEmMinutos,
  formatarDataHoraBrasilia,
  formatarIsoBrasilia,
  gerarHorariosLivres,
  serializarDatasNoFuso,
  horaParaMinutos,
  intervaloCabeNaGrade,
  intervalosSobrepoem,
  somarMinutos,
} from './datas';

describe('datas', () => {
  it('converte hora em minutos', () => {
    expect(horaParaMinutos('08:30')).toBe(510);
  });

  it('converte entre Brasilia e UTC', () => {
    const data = criarDataBrasilia(2026, 11, 9, 10, 30);
    expect(data.toISOString()).toBe('2026-11-09T13:30:00.000Z');
    expect(componentesBrasilia(data)).toEqual({
      ano: 2026,
      mes: 11,
      dia: 9,
      hora: 10,
      minuto: 30,
      diaSemana: 1,
    });
  });

  it('permite aulas consecutivas e detecta sobreposicao', () => {
    const base = criarDataBrasilia(2026, 11, 9, 14);
    const a = { inicio: base, fim: somarMinutos(base, 60) };
    const consecutiva = { inicio: a.fim, fim: somarMinutos(a.fim, 60) };
    const sobreposta = { inicio: somarMinutos(base, 30), fim: somarMinutos(base, 90) };
    expect(intervalosSobrepoem(a, consecutiva)).toBe(false);
    expect(intervalosSobrepoem(a, sobreposta)).toBe(true);
  });

  it('detecta faixas sobrepostas apenas no mesmo dia', () => {
    expect(
      faixasSeSobrepoem([
        { diaSemana: 1, horaInicio: '08:00', horaFim: '10:00' },
        { diaSemana: 1, horaInicio: '09:00', horaFim: '11:00' },
      ]),
    ).toBe(true);
    expect(
      faixasSeSobrepoem([
        { diaSemana: 1, horaInicio: '08:00', horaFim: '10:00' },
        { diaSemana: 1, horaInicio: '10:00', horaFim: '11:00' },
        { diaSemana: 2, horaInicio: '08:00', horaFim: '10:00' },
      ]),
    ).toBe(false);
  });

  it('gera horarios livres descontando bloqueios e aulas ocupadas', () => {
    const agora = criarDataBrasilia(2026, 11, 6, 10);
    const de = criarDataBrasilia(2026, 11, 9);
    const ate = criarDataBrasilia(2026, 11, 10);
    const livres = gerarHorariosLivres({
      grade: [{ diaSemana: 1, horaInicio: '08:00', horaFim: '12:00' }],
      bloqueios: [
        { inicio: criarDataBrasilia(2026, 11, 9, 9), fim: criarDataBrasilia(2026, 11, 9, 10) },
      ],
      ocupados: [
        { inicio: criarDataBrasilia(2026, 11, 9, 11), fim: criarDataBrasilia(2026, 11, 9, 12) },
      ],
      de,
      ate,
      agora,
    });
    expect(livres.map((item) => componentesBrasilia(item.inicio).hora)).toEqual([8, 10]);
  });

  it('nao oferece horarios no passado', () => {
    const agora = criarDataBrasilia(2026, 11, 9, 9, 30);
    const livres = gerarHorariosLivres({
      grade: [{ diaSemana: 1, horaInicio: '08:00', horaFim: '11:00' }],
      bloqueios: [],
      ocupados: [],
      de: criarDataBrasilia(2026, 11, 9),
      ate: criarDataBrasilia(2026, 11, 10),
      agora,
    });
    expect(livres.map((item) => componentesBrasilia(item.inicio).hora)).toEqual([10]);
  });

  it('verifica se o intervalo cabe na grade', () => {
    const grade = [{ diaSemana: 1, horaInicio: '08:00', horaFim: '12:00' }];
    const dentro = {
      inicio: criarDataBrasilia(2026, 11, 9, 9),
      fim: criarDataBrasilia(2026, 11, 9, 10),
    };
    const fora = {
      inicio: criarDataBrasilia(2026, 11, 9, 11, 30),
      fim: criarDataBrasilia(2026, 11, 9, 12, 30),
    };
    const outroDia = {
      inicio: criarDataBrasilia(2026, 11, 10, 9),
      fim: criarDataBrasilia(2026, 11, 10, 10),
    };
    expect(intervaloCabeNaGrade(grade, dentro)).toBe(true);
    expect(intervaloCabeNaGrade(grade, fora)).toBe(false);
    expect(intervaloCabeNaGrade(grade, outroDia)).toBe(false);
  });

  it('usa o fuso America/Sao_Paulo (-03:00, sem horario de verao desde 2019)', () => {
    expect(deslocamentoDoFusoEmMinutos(new Date('2026-11-09T12:00:00.000Z'))).toBe(-180);
    expect(deslocamentoDoFusoEmMinutos(new Date('2026-01-15T12:00:00.000Z'))).toBe(-180);
  });

  it('respeita o horario de verao historico do fuso (jan/2018 era -02:00)', () => {
    expect(deslocamentoDoFusoEmMinutos(new Date('2018-01-15T12:00:00.000Z'))).toBe(-120);
    expect(criarDataBrasilia(2018, 1, 15, 10).toISOString()).toBe('2018-01-15T12:00:00.000Z');
  });

  it('normaliza dia fora do mes ao criar a data', () => {
    expect(componentesBrasilia(criarDataBrasilia(2026, 11, 31, 9))).toMatchObject({
      ano: 2026,
      mes: 12,
      dia: 1,
      hora: 9,
    });
  });

  it('formata em ISO 8601 com o deslocamento de Brasilia', () => {
    expect(formatarIsoBrasilia(new Date('2026-11-10T11:00:00.000Z'))).toBe(
      '2026-11-10T08:00:00.000-03:00',
    );
    expect(formatarIsoBrasilia(new Date('2026-11-10T02:30:45.123Z'))).toBe(
      '2026-11-09T23:30:45.123-03:00',
    );
    const texto = formatarIsoBrasilia(new Date('2026-11-10T11:00:00.000Z'));
    expect(new Date(texto).toISOString()).toBe('2026-11-10T11:00:00.000Z');
  });

  it('serializa as datas do JSON das respostas no horario de Brasilia', () => {
    const corpo = {
      aula: { inicio: new Date('2026-11-10T11:00:00.000Z'), nome: 'Física' },
      lista: [new Date('2026-11-10T12:00:00.000Z')],
      vazio: null,
    };
    expect(JSON.parse(JSON.stringify(corpo, serializarDatasNoFuso))).toEqual({
      aula: { inicio: '2026-11-10T08:00:00.000-03:00', nome: 'Física' },
      lista: ['2026-11-10T09:00:00.000-03:00'],
      vazio: null,
    });
  });

  it('formata data e hora no fuso de Brasilia', () => {
    expect(formatarDataHoraBrasilia(criarDataBrasilia(2026, 11, 9, 9, 5))).toBe(
      '09/11/2026 às 09:05',
    );
    expect(formatarDataHoraBrasilia(new Date('2026-11-10T02:30:00.000Z'))).toBe(
      '09/11/2026 às 23:30',
    );
  });
});
