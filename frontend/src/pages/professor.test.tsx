import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buscarProfessor,
  buscarProfessores,
  type ProfessorDetalhe,
  type ProfessorPublico,
} from '../services/professores';
import { renderizar } from '../test/renderizar';
import { linkParaSolicitar } from '../utils/links';
import { PaginaProfessor } from './professor';

vi.mock('../services/professores', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/professores')>()),
  buscarProfessor: vi.fn(),
  buscarProfessores: vi.fn(),
}));

const buscarProfessorMock = vi.mocked(buscarProfessor);
const buscarProfessoresMock = vi.mocked(buscarProfessores);

const CARLOS: ProfessorPublico = {
  id: 'p2',
  nome: 'Carlos Lima',
  apresentacao: 'Física para o ENEM.',
  valorHora: 60,
  modalidades: ['ONLINE'],
  materias: [{ id: 'm1', nome: 'Física', nivel: 'Ensino Médio' }],
};

// "Hoje" nos testes: segunda-feira, 09/11/2026, 09:00 em Brasília.
const AGORA = new Date('2026-11-09T09:00:00.000-03:00');

const ANA: ProfessorDetalhe = {
  id: 'p1',
  nome: 'Ana Souza',
  apresentacao: 'Professora de exatas com 8 anos de experiência.',
  valorHora: 90,
  modalidades: ['ONLINE', 'PRESENCIAL'],
  materias: [
    { id: 'm1', nome: 'Física', nivel: 'Ensino Médio' },
    { id: 'm2', nome: 'Matemática', nivel: 'Ensino Médio' },
    { id: 'm3', nome: 'Matemática', nivel: 'Ensino Fundamental' },
  ],
  horariosLivres: [
    { inicio: '2026-11-10T14:00:00.000-03:00', fim: '2026-11-10T15:00:00.000-03:00' }, // ter, fora de ordem de propósito
    { inicio: '2026-11-10T08:00:00.000-03:00', fim: '2026-11-10T09:00:00.000-03:00' },
    { inicio: '2026-11-12T10:00:00.000-03:00', fim: '2026-11-12T11:00:00.000-03:00' },
    { inicio: '2026-11-17T09:00:00.000-03:00', fim: '2026-11-17T10:00:00.000-03:00' },
  ],
};

function erroHttp(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError('falha', 'ERR', config, undefined, { status, statusText: '', headers: {}, config, data: {} });
}

function abrir() {
  return renderizar(<PaginaProfessor />, { url: '/professores/p1', caminho: '/professores/:id' });
}

function horariosVisiveis(): string[] {
  const lista = screen.getByRole('list', { name: 'Horários livres' });
  return within(lista)
    .getAllByRole('button')
    .map((botao) => botao.textContent ?? '');
}

describe('PaginaProfessor', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AGORA);
    buscarProfessorMock.mockResolvedValue(ANA);
    // A busca de "mais professores" devolve a própria Ana também: ela deve ser descartada.
    buscarProfessoresMock.mockResolvedValue({ itens: [ANA, CARLOS], total: 2, pagina: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra o perfil do professor', async () => {
    abrir();

    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Souza' })).toBeInTheDocument();
    expect(buscarProfessorMock).toHaveBeenCalledWith('p1');
    expect(screen.getByText('Aulas de Física e Matemática')).toBeInTheDocument();
    expect(screen.getByText('Professora de exatas com 8 anos de experiência.')).toBeInTheDocument();
    expect(screen.getByText(/ficam disponíveis após a confirmação da aula/)).toBeInTheDocument();
    expect(screen.getByText('Não é necessário pagar para solicitar uma aula.', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Agende sua aula' })).toBeInTheDocument();
    expect(document.title).toBe('Ana Souza — AulaCerta');
  });

  it('resume valor e duração da aula', async () => {
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });

    const resumo = screen.getByText('Duração').closest('dl') as HTMLElement;
    expect(within(resumo).getByText('Valor da aula')).toBeInTheDocument();
    expect(within(resumo).getByText(/R\$\s*90/)).toBeInTheDocument();
    expect(within(resumo).getByText('/hora')).toBeInTheDocument();
    expect(within(resumo).getByText('1 hora')).toBeInTheDocument();
  });

  it('agrupa os níveis por matéria', async () => {
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });

    const niveis = screen.getByRole('list', { name: 'Níveis de Matemática' });
    expect(
      within(niveis)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Ensino Médio', 'Ensino Fundamental']);
  });

  it('explica as modalidades que o professor atende', async () => {
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });

    const secao = screen.getByRole('region', { name: 'Modalidades de atendimento' });
    expect(within(secao).getByText('Online')).toBeInTheDocument();
    expect(within(secao).getByText('Presencial')).toBeInTheDocument();
    expect(within(secao).queryByText('Em domicílio')).not.toBeInTheDocument();
  });

  it('sugere outros professores da mesma matéria, sem repetir o atual', async () => {
    abrir();

    const secao = await screen.findByRole('region', { name: 'Mais professores de Física' });
    expect(buscarProfessoresMock).toHaveBeenCalledWith({ materia: 'Física', limite: 4 });
    expect(within(secao).getByText('Carlos Lima')).toBeInTheDocument();
    expect(within(secao).queryByText('Ana Souza')).not.toBeInTheDocument();
  });

  it('esconde a sugestão quando não há outros professores', async () => {
    buscarProfessoresMock.mockResolvedValue({ itens: [ANA], total: 1, pagina: 1 });
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });

    expect(screen.queryByRole('region', { name: /Mais professores/ })).not.toBeInTheDocument();
  });

  it('no celular, oferece um atalho para os horários', async () => {
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });

    expect(screen.getByRole('link', { name: 'Ver horários' })).toHaveAttribute('href', '#horarios');
    expect(document.getElementById('horarios')).toBeInTheDocument();
  });

  it('abre no primeiro dia com horários, no horário de Brasília e em ordem', async () => {
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });

    expect(screen.getByText('terça-feira, 10 de novembro')).toBeInTheDocument();
    expect(horariosVisiveis()).toEqual(['08:00', '14:00']);
    expect(screen.getByRole('button', { name: 'segunda-feira, 9 de novembro, sem horários' })).toBeDisabled();
    expect(screen.getByText('Selecione um horário para continuar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar aula' })).toBeDisabled();
  });

  it('ao escolher um horário, mostra o resumo e o link para solicitar', async () => {
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });

    await userEvent.click(screen.getByRole('button', { name: '08:00' }));

    expect(screen.getByRole('button', { name: '08:00' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('8h às 9h')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Solicitar aula' })).toHaveAttribute(
      'href',
      linkParaSolicitar('p1', { inicio: '2026-11-10T08:00:00.000-03:00', fim: '2026-11-10T09:00:00.000-03:00' }),
    );
  });

  it('trocar de dia mostra os horários dele e desfaz a escolha anterior', async () => {
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });
    await userEvent.click(screen.getByRole('button', { name: '14:00' }));

    await userEvent.click(screen.getByRole('button', { name: 'quinta-feira, 12 de novembro, 1 horário' }));

    expect(horariosVisiveis()).toEqual(['10:00']);
    expect(screen.queryByRole('link', { name: 'Solicitar aula' })).not.toBeInTheDocument();
  });

  it('navega entre as semanas', async () => {
    abrir();
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });
    expect(screen.getByText('09 a 15 de novembro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Semana anterior' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Próxima semana' }));

    expect(screen.getByText('16 a 22 de novembro')).toBeInTheDocument();
    expect(screen.getByText('terça-feira, 17 de novembro')).toBeInTheDocument();
    expect(horariosVisiveis()).toEqual(['09:00']);
  });

  it('avisa quando o professor não tem horários livres', async () => {
    buscarProfessorMock.mockResolvedValue({ ...ANA, horariosLivres: [] });
    abrir();

    expect(await screen.findByText('Sem horários livres nas próximas 4 semanas.')).toBeInTheDocument();
  });

  it('mostra "professor não encontrado" quando a API responde 404', async () => {
    buscarProfessorMock.mockRejectedValue(erroHttp(404));
    abrir();

    expect(await screen.findByRole('heading', { name: 'Professor não encontrado' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Encontrar professores' }).length).toBeGreaterThan(0);
  });

  it('mostra o erro e tenta novamente em outras falhas', async () => {
    buscarProfessorMock.mockRejectedValueOnce(erroHttp(500)).mockResolvedValueOnce(ANA);
    abrir();

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Souza' })).toBeInTheDocument();
  });
});
