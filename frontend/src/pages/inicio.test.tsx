import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buscarProfessores, listarMaterias, type ProfessorPublico } from '../services/professores';
import { renderizar } from '../test/renderizar';
import { PaginaInicio } from './inicio';

vi.mock('../services/professores', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/professores')>()),
  buscarProfessores: vi.fn(),
  listarMaterias: vi.fn(),
}));

const buscarProfessoresMock = vi.mocked(buscarProfessores);
const listarMateriasMock = vi.mocked(listarMaterias);

const ANA: ProfessorPublico = {
  id: 'p1',
  nome: 'Ana Souza',
  apresentacao: 'Professora de exatas há 8 anos.',
  valorHora: 80,
  modalidades: ['ONLINE', 'PRESENCIAL'],
  materias: [
    { id: 'm1', nome: 'Matemática', nivel: 'Ensino Médio' },
    { id: 'm2', nome: 'Física', nivel: 'Ensino Médio' },
    { id: 'm3', nome: 'Química', nivel: 'Ensino Médio' },
    { id: 'm4', nome: 'Matemática', nivel: 'Ensino Fundamental' },
  ],
};

describe('PaginaInicio', () => {
  beforeEach(() => {
    listarMateriasMock.mockResolvedValue([]);
  });

  it('pede os seis professores em destaque', async () => {
    buscarProfessoresMock.mockResolvedValue({ itens: [], total: 0, pagina: 1 });
    renderizar(<PaginaInicio />);

    await waitFor(() => expect(buscarProfessoresMock).toHaveBeenCalledWith({ limite: 6 }));
  });

  it('mostra o estado de carregamento enquanto busca os professores', () => {
    buscarProfessoresMock.mockReturnValue(new Promise(() => {}));
    const { container } = renderizar(<PaginaInicio />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível carregar os professores.')).not.toBeInTheDocument();
  });

  it('mostra o erro e tenta de novo ao clicar no botão', async () => {
    buscarProfessoresMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ itens: [ANA], total: 1, pagina: 1 });
    renderizar(<PaginaInicio />);

    expect(await screen.findByText('Não foi possível carregar os professores.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(buscarProfessoresMock).toHaveBeenCalledTimes(2);
  });

  it('mostra o estado vazio quando não há professores', async () => {
    buscarProfessoresMock.mockResolvedValue({ itens: [], total: 0, pagina: 1 });
    renderizar(<PaginaInicio />);

    expect(await screen.findByText('Ainda não há professores disponíveis.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastre-se e publique seus horários.' })).toHaveAttribute(
      'href',
      '/cadastro?perfil=PROFESSOR',
    );
  });

  it('lista os professores com valor, modalidades, matérias e link para os horários', async () => {
    buscarProfessoresMock.mockResolvedValue({ itens: [ANA], total: 1, pagina: 1 });
    renderizar(<PaginaInicio />);

    const cartao = (await screen.findByText('Ana Souza')).closest('article') as HTMLElement;
    expect(within(cartao).getByText(/R\$\s*80/)).toBeInTheDocument();
    expect(within(cartao).getByText('Online')).toBeInTheDocument();
    expect(within(cartao).getByText('Presencial')).toBeInTheDocument();
    expect(within(cartao).getByText('Matemática · Ensino Médio')).toBeInTheDocument();
    expect(within(cartao).getByText('+1')).toBeInTheDocument();
    expect(within(cartao).getByRole('link', { name: 'Ver horários de Ana Souza' })).toHaveAttribute(
      'href',
      '/professores/p1',
    );
  });

  it('mostra matérias populares da API sem repetir nomes', async () => {
    buscarProfessoresMock.mockResolvedValue({ itens: [], total: 0, pagina: 1 });
    listarMateriasMock.mockResolvedValue([
      { id: 'm1', nome: 'Matemática', nivel: 'Ensino Médio' },
      { id: 'm2', nome: 'Matemática', nivel: 'Ensino Fundamental' },
      { id: 'm3', nome: 'Artes', nivel: 'Ensino Médio' },
    ]);
    renderizar(<PaginaInicio />);

    const artes = await screen.findByRole('link', { name: 'Artes' });
    expect(artes).toHaveAttribute('href', '/professores?materia=Artes');
    expect(screen.getAllByRole('link', { name: 'Matemática' })).toHaveLength(1);
  });

  it('usa a lista padrão de matérias quando a API não responde', async () => {
    buscarProfessoresMock.mockResolvedValue({ itens: [], total: 0, pagina: 1 });
    listarMateriasMock.mockRejectedValue(new Error('offline'));
    renderizar(<PaginaInicio />);

    expect(await screen.findByRole('link', { name: 'Redação' })).toHaveAttribute(
      'href',
      '/professores?materia=Reda%C3%A7%C3%A3o',
    );
  });
});
