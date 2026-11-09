import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizar } from '../test/renderizar';
import { Cabecalho } from './cabecalho';

describe('Cabecalho', () => {
  it('abre e fecha o menu do celular', async () => {
    renderizar(<Cabecalho />);
    const botao = screen.getByRole('button', { name: 'Abrir menu' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('menu-movel')).not.toBeInTheDocument();

    await userEvent.click(botao);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('menu-movel')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(document.getElementById('menu-movel')).not.toBeInTheDocument();
  });

  it('leva para entrar e criar conta', () => {
    renderizar(<Cabecalho />);
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro');
  });
});
