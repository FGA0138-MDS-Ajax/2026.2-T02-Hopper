import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buscarProfessores, listarMaterias, type ProfessorPublico } from '../services/professores';
import { renderizar } from '../test/renderizar';
import { PaginaProfessores, PROFESSORES_POR_PAGINA } from './professores';

vi.mock('../services/professores', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/professores')>()),
  buscarProfessores: vi.fn(),
  listarMaterias: vi.fn(),
}));

const buscarProfessoresMock = vi.mocked(buscarProfessores);

function professor(id: string, nome: string): ProfessorPublico {
  return {
    id,
    nome,
    apresentacao: 'Apresentação.',
    valorHora: 60,
    modalidades: ['ONLINE'],
    materias: [{ id: 'm1', nome: 'Física', nivel: 'Ensino Médio' }],
  };
}

function abrir(url: string) {
  return renderizar(<PaginaProfessores />, { url, caminho: '/professores' });
}

function urlAtual(): URL {
  return new URL(screen.getByTestId('local-atual').textContent ?? '', 'http://teste');
}

describe('PaginaProfessores', () => {
  beforeEach(() => {
    vi.mocked(listarMaterias).mockResolvedValue([{ id: 'm1', nome: 'Física', nivel: 'Ensino Médio' }]);
    buscarProfessoresMock.mockResolvedValue({ itens: [professor('p1', 'Ana Souza')], total: 1, pagina: 1 });
  });

  it('busca com os filtros da URL e preenche a barra de busca', async () => {
    abrir('/professores?materia=F%C3%ADsica&nivel=Ensino+M%C3%A9dio&modalidade=ONLINE');

    await waitFor(() =>
      expect(buscarProfessoresMock).toHaveBeenCalledWith({
        materia: 'Física',
        nivel: 'Ensino Médio',
        modalidade: 'ONLINE',
        pagina: 1,
        limite: PROFESSORES_POR_PAGINA,
      }),
    );
    expect(screen.getByLabelText('Matéria')).toHaveValue('Física');
    expect(screen.getByLabelText('Modalidade')).toHaveValue('ONLINE');
    expect(await screen.findByText('1 professor encontrado')).toBeInTheDocument();
  });

  it('ignora modalidade e página inválidas na URL', async () => {
    abrir('/professores?modalidade=VOANDO&pagina=-3');

    await waitFor(() =>
      expect(buscarProfessoresMock).toHaveBeenCalledWith({ pagina: 1, limite: PROFESSORES_POR_PAGINA }),
    );
    expect(screen.queryByRole('list', { name: 'Filtros aplicados' })).not.toBeInTheDocument();
  });

  it('remove um filtro aplicado e volta para a primeira página', async () => {
    abrir('/professores?materia=F%C3%ADsica&modalidade=ONLINE&pagina=2');
    const filtros = await screen.findByRole('list', { name: 'Filtros aplicados' });

    await userEvent.click(within(filtros).getByRole('button', { name: 'Remover filtro Modalidade: Online' }));

    const url = urlAtual();
    expect(url.searchParams.get('materia')).toBe('Física');
    expect(url.searchParams.has('modalidade')).toBe(false);
    expect(url.searchParams.has('pagina')).toBe(false);
  });

  it('mostra o estado vazio e limpa os filtros', async () => {
    buscarProfessoresMock.mockResolvedValue({ itens: [], total: 0, pagina: 1 });
    abrir('/professores?materia=Astronomia');

    expect(await screen.findByText('Nenhum professor encontrado para esses filtros.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nenhum professor encontrado' })).toBeInTheDocument();

    const botoes = screen.getAllByRole('button', { name: 'Limpar filtros' });
    await userEvent.click(botoes[botoes.length - 1]);
    expect(urlAtual().search).toBe('');
  });

  it('pagina os resultados', async () => {
    buscarProfessoresMock.mockResolvedValue({
      itens: [professor('p1', 'Ana Souza')],
      total: PROFESSORES_POR_PAGINA * 2 + 1,
      pagina: 1,
    });
    abrir('/professores');

    const paginacao = await screen.findByRole('navigation', { name: 'Paginação' });
    expect(within(paginacao).getByText('Página 1 de 3')).toBeInTheDocument();
    expect(within(paginacao).getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await userEvent.click(within(paginacao).getByRole('button', { name: 'Próxima' }));
    expect(urlAtual().searchParams.get('pagina')).toBe('2');
    await waitFor(() =>
      expect(buscarProfessoresMock).toHaveBeenLastCalledWith({ pagina: 2, limite: PROFESSORES_POR_PAGINA }),
    );
  });

  it('não mostra paginação quando cabe tudo em uma página', async () => {
    abrir('/professores');
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('mostra o erro e tenta novamente', async () => {
    buscarProfessoresMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ itens: [professor('p1', 'Ana Souza')], total: 1, pagina: 1 });
    abrir('/professores');

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  });

  it('define o título da aba', () => {
    abrir('/professores');
    expect(document.title).toBe('Encontrar professores — AulaCerta');
  });
});
