import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Cabecalho } from '../components/cabecalho';
import { RotaProtegida } from '../components/rota-protegida';
import { lerToken, removerToken, salvarToken } from '../services/api';
import { obterUsuarioAtual, type Usuario } from '../services/auth';
import { renderizar } from '../test/renderizar';
import { comVoltar, destinoSeguro } from '../utils/redirecionamento';

vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  obterUsuarioAtual: vi.fn(),
}));

const obterUsuarioAtualMock = vi.mocked(obterUsuarioAtual);

const CAIO: Usuario = { id: 'u1', nome: 'Caio Alves', email: 'caio@email.com', telefone: null, perfil: 'ALUNO' };

describe('sessão do usuário', () => {
  afterEach(() => removerToken());

  it('visitante vê "Entrar" e "Criar conta" no cabeçalho', () => {
    renderizar(<Cabecalho />);
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(obterUsuarioAtualMock).not.toHaveBeenCalled();
  });

  it('com token salvo, confirma o usuário na API e mostra o nome', async () => {
    salvarToken('token-valido');
    obterUsuarioAtualMock.mockResolvedValue(CAIO);
    renderizar(<Cabecalho />);

    expect(await screen.findByText('Olá, Caio')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });

  it('sair apaga a sessão e volta para o início', async () => {
    salvarToken('token-valido');
    obterUsuarioAtualMock.mockResolvedValue(CAIO);
    renderizar(<Cabecalho />, { url: '/professores', caminho: '/professores' });

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(lerToken()).toBeNull();
    expect(screen.getByTestId('local-atual')).toHaveTextContent(/^\/$/);
  });

  it('rota protegida manda o visitante para o login com o destino', () => {
    renderizar(
      <RotaProtegida>
        <p>Formulário de solicitação</p>
      </RotaProtegida>,
      { url: '/professores/p1/solicitar?inicio=x', caminho: '/professores/:id/solicitar' },
    );

    expect(screen.queryByText('Formulário de solicitação')).not.toBeInTheDocument();
    expect(screen.getByTestId('local-atual')).toHaveTextContent(
      '/entrar?voltar=%2Fprofessores%2Fp1%2Fsolicitar%3Finicio%3Dx',
    );
  });

  it('rota protegida mostra a tela para quem está logado', async () => {
    salvarToken('token-valido');
    obterUsuarioAtualMock.mockResolvedValue(CAIO);
    renderizar(
      <RotaProtegida>
        <p>Formulário de solicitação</p>
      </RotaProtegida>,
      { url: '/professores/p1/solicitar', caminho: '/professores/:id/solicitar' },
    );

    expect(await screen.findByText('Formulário de solicitação')).toBeInTheDocument();
  });
});

describe('redirecionamento seguro', () => {
  it('aceita só caminhos internos', () => {
    expect(destinoSeguro('/professores/p1')).toBe('/professores/p1');
    expect(destinoSeguro('https://site-falso.com')).toBe('/');
    expect(destinoSeguro('//site-falso.com')).toBe('/');
    expect(destinoSeguro('/\\site-falso.com')).toBe('/');
    expect(destinoSeguro(null)).toBe('/');
  });

  it('monta o link de login preservando o destino', () => {
    expect(comVoltar('/entrar', '/professores')).toBe('/entrar?voltar=%2Fprofessores');
    expect(comVoltar('/entrar', null)).toBe('/entrar');
  });
});
