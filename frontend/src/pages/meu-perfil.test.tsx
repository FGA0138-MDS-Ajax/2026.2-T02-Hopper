import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lerValorEmReais, periodoDoBloqueio, validarGrade } from '../components/area-professor/regras';
import { removerToken, salvarToken } from '../services/api';
import {
  criarBloqueio,
  listarBloqueios,
  obterGrade,
  obterMeuPerfil,
  removerBloqueio,
  salvarGrade,
  salvarMeuPerfil,
  type MeuPerfil,
} from '../services/area-professor';
import { obterUsuarioAtual, type Usuario } from '../services/auth';
import { listarMaterias } from '../services/professores';
import { renderizar } from '../test/renderizar';
import { PaginaMeuPerfil } from './meu-perfil';

vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  obterUsuarioAtual: vi.fn(),
}));
vi.mock('../services/professores', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/professores')>()),
  listarMaterias: vi.fn(),
}));
vi.mock('../services/area-professor', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/area-professor')>()),
  obterMeuPerfil: vi.fn(),
  salvarMeuPerfil: vi.fn(),
  obterGrade: vi.fn(),
  salvarGrade: vi.fn(),
  listarBloqueios: vi.fn(),
  criarBloqueio: vi.fn(),
  removerBloqueio: vi.fn(),
}));

// "Agora" nos testes: segunda-feira, 09/11/2026, 09:00 em Brasília.
const AGORA = new Date('2026-11-09T09:00:00.000-03:00');

const RITA: Usuario = { id: 'u9', nome: 'Rita Lopes', email: 'rita@email.com', telefone: null, perfil: 'PROFESSOR' };

const PERFIL_VAZIO: MeuPerfil = {
  id: 'p9',
  nome: 'Rita Lopes',
  apresentacao: '',
  valorHora: null,
  modalidades: [],
  materias: [],
  completo: false,
};

const PERFIL_COMPLETO: MeuPerfil = {
  ...PERFIL_VAZIO,
  apresentacao: 'Professora de matemática.',
  valorHora: 80,
  modalidades: ['ONLINE'],
  materias: [{ id: 'm1', nome: 'Matemática', nivel: 'Ensino Médio' }],
  completo: true,
};

function abrir(url = '/meu-perfil') {
  return renderizar(<PaginaMeuPerfil />, { url, caminho: '/meu-perfil' });
}

describe('PaginaMeuPerfil', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AGORA);
    salvarToken('token');
    vi.mocked(obterUsuarioAtual).mockResolvedValue(RITA);
    vi.mocked(listarMaterias).mockResolvedValue([
      { id: 'm1', nome: 'Matemática', nivel: 'Ensino Médio' },
      { id: 'm2', nome: 'Matemática', nivel: 'Ensino Fundamental' },
      { id: 'm3', nome: 'Física', nivel: 'Ensino Médio' },
    ]);
    vi.mocked(obterMeuPerfil).mockResolvedValue(PERFIL_VAZIO);
    vi.mocked(obterGrade).mockResolvedValue([]);
    vi.mocked(listarBloqueios).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    removerToken();
  });

  it('só professores usam a área', async () => {
    vi.mocked(obterUsuarioAtual).mockResolvedValue({ ...RITA, perfil: 'ALUNO' });
    abrir();
    expect(await screen.findByText('Esta área é para contas de professor.')).toBeInTheDocument();
    expect(obterMeuPerfil).not.toHaveBeenCalled();
  });

  it('professor novo vê as boas-vindas e o que falta para aparecer na busca', async () => {
    abrir('/meu-perfil?bem-vindo=1');

    expect(await screen.findByRole('status')).toHaveTextContent('Conta criada!');
    const situacao = await screen.findByRole('region', { name: 'Situação do perfil' });
    expect(within(situacao).getByText('Complete seu perfil para aparecer na busca')).toBeInTheDocument();
    // Os cinco itens (apresentação, matérias, modalidades, valor e grade) estão pendentes.
    expect(within(situacao).getAllByText(': falta preencher')).toHaveLength(5);
  });

  it('perfil completo e com grade aparece como visível, com link para o perfil público', async () => {
    vi.mocked(obterMeuPerfil).mockResolvedValue(PERFIL_COMPLETO);
    vi.mocked(obterGrade).mockResolvedValue([{ diaSemana: 1, horaInicio: '08:00', horaFim: '12:00' }]);
    abrir();

    const situacao = await screen.findByRole('region', { name: 'Situação do perfil' });
    expect(within(situacao).getByText('Seu perfil está visível na busca')).toBeInTheDocument();
    expect(within(situacao).getByRole('link', { name: /Ver como os alunos veem/ })).toHaveAttribute(
      'href',
      '/professores/p9',
    );
  });

  describe('aba Perfil', () => {
    it('valida os campos obrigatórios', async () => {
      abrir();
      await userEvent.click(await screen.findByRole('button', { name: 'Salvar perfil' }));

      expect(await screen.findByText('Escreva uma apresentação para os alunos.')).toBeInTheDocument();
      expect(screen.getByText('Escolha pelo menos uma matéria e nível.')).toBeInTheDocument();
      expect(screen.getByText('Escolha pelo menos uma modalidade.')).toBeInTheDocument();
      expect(screen.getByText(/Informe o valor da hora-aula/)).toBeInTheDocument();
      expect(salvarMeuPerfil).not.toHaveBeenCalled();
    });

    it('salva apresentação, matérias, modalidades e valor', async () => {
      vi.mocked(salvarMeuPerfil).mockResolvedValue(PERFIL_COMPLETO);
      abrir();

      await userEvent.type(await screen.findByLabelText('Apresentação'), 'Professora de matemática.');
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Matemática, Ensino Médio' }));
      await userEvent.click(screen.getByRole('checkbox', { name: /Online/ }));
      await userEvent.type(screen.getByLabelText('Valor da hora-aula'), '80,50');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));

      expect(salvarMeuPerfil).toHaveBeenCalledWith({
        apresentacao: 'Professora de matemática.',
        materiaIds: ['m1'],
        modalidades: ['ONLINE'],
        valorHora: 80.5,
      });
      expect(await screen.findByRole('status')).toHaveTextContent('Perfil salvo.');
    });
  });

  describe('aba Grade semanal', () => {
    it('monta a grade, repete nos dias úteis e salva', async () => {
      vi.mocked(salvarGrade).mockImplementation(async (faixas) => faixas);
      abrir('/meu-perfil?aba=grade');

      await userEvent.click(await screen.findByRole('button', { name: 'Adicionar horário na Segunda-feira' }));
      expect(screen.getByText(/4 horários de aula por semana/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Repetir segunda nos dias úteis' }));
      expect(screen.getByText(/20 horários de aula por semana/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Salvar grade' }));

      expect(salvarGrade).toHaveBeenCalledWith(
        [1, 2, 3, 4, 5].map((dia) => ({ diaSemana: dia, horaInicio: '08:00', horaFim: '12:00' })),
      );
      expect(await screen.findByRole('status')).toHaveTextContent('Grade salva.');
    });

    it('não salva horários sobrepostos no mesmo dia', async () => {
      vi.mocked(obterGrade).mockResolvedValue([
        { diaSemana: 1, horaInicio: '08:00', horaFim: '12:00' },
        { diaSemana: 1, horaInicio: '14:00', horaFim: '18:00' },
      ]);
      abrir('/meu-perfil?aba=grade');

      const inicioDaTarde = (await screen.findAllByLabelText('Segunda-feira: início'))[1];
      fireEvent.change(inicioDaTarde, { target: { value: '11:00' } });
      await userEvent.click(screen.getByRole('button', { name: 'Salvar grade' }));

      expect(await screen.findByText('Os horários deste dia se sobrepõem.')).toBeInTheDocument();
      expect(salvarGrade).not.toHaveBeenCalled();
    });
  });

  describe('aba Bloqueios', () => {
    it('cria um bloqueio de dia inteiro no horário de Brasília', async () => {
      vi.mocked(criarBloqueio).mockResolvedValue({
        id: 'b1',
        inicio: '2026-11-20T00:00:00.000-03:00',
        fim: '2026-11-21T00:00:00.000-03:00',
        motivo: 'Feriado',
      });
      abrir('/meu-perfil?aba=bloqueios');

      fireEvent.change(await screen.findByLabelText('De'), { target: { value: '2026-11-20' } });
      await userEvent.type(screen.getByLabelText(/Motivo/), 'Feriado');
      await userEvent.click(screen.getByRole('button', { name: 'Bloquear período' }));

      expect(criarBloqueio).toHaveBeenCalledWith({
        inicio: '2026-11-20T03:00:00.000Z',
        fim: '2026-11-21T03:00:00.000Z',
        motivo: 'Feriado',
      });
      expect(await screen.findByRole('status')).toHaveTextContent('Bloqueio de Sex, 20/11 · dia inteiro criado.');
    });

    it('lista e remove bloqueios com confirmação', async () => {
      vi.mocked(listarBloqueios).mockResolvedValue([
        { id: 'b1', inicio: '2026-11-20T14:00:00.000-03:00', fim: '2026-11-20T18:00:00.000-03:00', motivo: 'Consulta' },
      ]);
      vi.mocked(removerBloqueio).mockResolvedValue();
      abrir('/meu-perfil?aba=bloqueios');

      expect(await screen.findByText('Sex, 20/11 · 14h às 18h')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Remover bloqueio de Sex, 20/11 · 14h às 18h' }));
      await userEvent.click(screen.getByRole('button', { name: 'Sim, remover' }));

      expect(removerBloqueio).toHaveBeenCalledWith('b1');
      expect(await screen.findByRole('status')).toHaveTextContent('voltaram a ficar livres');
    });

    it('não aceita bloqueio de dia inteiro começando hoje (já começou)', async () => {
      abrir('/meu-perfil?aba=bloqueios');

      fireEvent.change(await screen.findByLabelText('De'), { target: { value: '2026-11-09' } });
      await userEvent.click(screen.getByRole('button', { name: 'Bloquear período' }));

      expect(await screen.findByText(/O bloqueio precisa começar no futuro/)).toBeInTheDocument();
      expect(criarBloqueio).not.toHaveBeenCalled();
    });
  });
});

describe('regras da área do professor', () => {
  it('lê valores em reais em formatos comuns', () => {
    expect(lerValorEmReais('80')).toBe(80);
    expect(lerValorEmReais('80,50')).toBe(80.5);
    expect(lerValorEmReais('R$ 1.200,00')).toBe(1200);
    expect(lerValorEmReais('abc')).toBeNaN();
    expect(lerValorEmReais('')).toBeNaN();
  });

  it('valida a grade por dia', () => {
    expect(validarGrade([{ diaSemana: 2, horaInicio: '10:00', horaFim: '09:00' }]).get(2)).toBe(
      'O início precisa ser antes do fim.',
    );
    expect(validarGrade([{ diaSemana: 3, horaInicio: '08:00', horaFim: '12:00' }]).size).toBe(0);
  });

  it('calcula o período do bloqueio com horário', () => {
    expect(
      periodoDoBloqueio({
        dataInicio: '2026-11-20',
        dataFim: '2026-11-20',
        diaInteiro: false,
        horaInicio: '14:00',
        horaFim: '18:00',
      }),
    ).toEqual({ inicio: '2026-11-20T17:00:00.000Z', fim: '2026-11-20T21:00:00.000Z' });
  });
});
