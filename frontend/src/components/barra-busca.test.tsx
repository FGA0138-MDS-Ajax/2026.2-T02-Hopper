import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listarMaterias } from '../services/professores';
import { renderizar } from '../test/renderizar';
import { NIVEIS_PADRAO } from '../services/professores';
import { BarraBusca } from './barra-busca';

vi.mock('../services/professores', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/professores')>()),
  listarMaterias: vi.fn(),
}));

const listarMateriasMock = vi.mocked(listarMaterias);

function parametrosDaUrl(): URLSearchParams {
  const local = screen.getByTestId('local-atual').textContent ?? '';
  expect(local.startsWith('/professores')).toBe(true);
  return new URLSearchParams(local.split('?')[1] ?? '');
}

describe('BarraBusca', () => {
  beforeEach(() => {
    listarMateriasMock.mockResolvedValue([
      { id: 'm1', nome: 'Matemática', nivel: 'Ensino Médio' },
      { id: 'm2', nome: 'Português', nivel: 'Ensino Fundamental' },
      { id: 'm3', nome: 'Física', nivel: 'Ensino Médio' },
    ]);
  });

  it('sem filtros, leva para a lista completa de professores', async () => {
    renderizar(<BarraBusca />);
    await userEvent.click(screen.getByRole('button', { name: 'Buscar professores' }));

    expect(screen.getByTestId('local-atual')).toHaveTextContent(/^\/professores$/);
  });

  it('envia matéria, nível e modalidade na URL', async () => {
    renderizar(<BarraBusca />);
    await screen.findByRole('option', { name: 'Ensino Médio' });

    await userEvent.type(screen.getByLabelText('Matéria'), '  Matemática  ');
    await userEvent.selectOptions(screen.getByLabelText('Nível'), 'Ensino Médio');
    await userEvent.selectOptions(screen.getByLabelText('Modalidade'), 'ONLINE');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar professores' }));

    const parametros = parametrosDaUrl();
    expect(parametros.get('materia')).toBe('Matemática');
    expect(parametros.get('nivel')).toBe('Ensino Médio');
    expect(parametros.get('modalidade')).toBe('ONLINE');
  });

  it('não envia a matéria quando o campo tem só espaços', async () => {
    renderizar(<BarraBusca />);
    await userEvent.type(screen.getByLabelText('Matéria'), '   ');
    await userEvent.selectOptions(screen.getByLabelText('Modalidade'), 'DOMICILIO');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar professores' }));

    const parametros = parametrosDaUrl();
    expect(parametros.has('materia')).toBe(false);
    expect(parametros.get('modalidade')).toBe('DOMICILIO');
  });

  it('usa os níveis cadastrados na API, sem repetir e em ordem escolar', async () => {
    renderizar(<BarraBusca />);
    const seletor = screen.getByLabelText('Nível');

    await waitFor(() => {
      const opcoes = within(seletor)
        .getAllByRole('option')
        .map((opcao) => opcao.textContent);
      expect(opcoes).toEqual(['Todos os níveis', 'Ensino Fundamental', 'Ensino Médio']);
    });
  });

  it('mostra níveis padrão quando a API falha', async () => {
    listarMateriasMock.mockRejectedValue(new Error('offline'));
    renderizar(<BarraBusca />);
    await waitFor(() => expect(listarMateriasMock).toHaveBeenCalled());

    const opcoes = within(screen.getByLabelText('Nível'))
      .getAllByRole('option')
      .map((opcao) => opcao.textContent);
    expect(opcoes).toEqual(['Todos os níveis', ...NIVEIS_PADRAO]);
  });
});
