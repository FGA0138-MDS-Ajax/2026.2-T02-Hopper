import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar } from '../test/renderizar';
import { PaginaNaoEncontrada } from './nao-encontrada';

describe('PaginaNaoEncontrada', () => {
  it('avisa que a página não existe e oferece caminhos de volta', () => {
    renderizar(<PaginaNaoEncontrada />, { url: '/endereco-que-nao-existe', caminho: '*' });

    const principal = screen.getByRole('main');
    expect(within(principal).getByRole('heading', { name: 'Página não encontrada.' })).toBeInTheDocument();
    expect(within(principal).getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
    expect(within(principal).getByRole('link', { name: 'Encontrar professores' })).toHaveAttribute(
      'href',
      '/professores',
    );
    expect(document.title).toMatch(/Página não encontrada/);
  });
});
