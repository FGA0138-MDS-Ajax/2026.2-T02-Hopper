import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { removerToken, salvarToken } from './services/api';
import { simularApi, type Chamada } from './test/api-simulada';

const ALUNO = { id: 'u1', nome: 'Ana Aluna', email: 'ana@exemplo.com', telefone: null, perfil: 'ALUNO' };
const PROFESSOR = {
  id: 'p1',
  nome: 'Bruno Professor',
  apresentacao: 'Aulas de Física.',
  valorHora: 80,
  modalidades: ['ONLINE'],
  materias: [],
  horariosLivres: [],
};

/** Respostas mínimas para as telas abrirem sem ir à rede. */
function responder({ url }: Chamada): unknown {
  if (url === '/auth/me') return ALUNO;
  if (/^\/professores\/[^/]+$/.test(url) && url !== '/professores/me') return PROFESSOR;
  return { itens: [], total: 0, pagina: 1, naoLidas: 0 };
}

function abrir(endereco: string) {
  window.history.pushState({}, '', endereco);
  const clienteQuery = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={clienteQuery}>
      <App />
    </QueryClientProvider>,
  );
}

const esperarTitulo = (titulo: string) =>
  waitFor(() => expect(document.title).toBe(`${titulo} — AulaCerta`), { timeout: 5000 });

describe('rotas do aplicativo', () => {
  let api: ReturnType<typeof simularApi>;

  // window.scrollTo e scrollIntoView já são simulados no setup dos testes (jsdom não rola a página).
  beforeEach(() => {
    api = simularApi(responder);
  });

  afterEach(() => {
    api.restaurar();
    removerToken();
    window.history.pushState({}, '', '/');
  });

  it.each([
    ['/professores', 'Encontrar professores'],
    ['/professores/p1', 'Bruno Professor'],
    ['/entrar', 'Entrar'],
    ['/cadastro', 'Criar conta'],
    ['/recuperar-senha', 'Recuperar senha'],
    ['/redefinir-senha?token=abc', 'Criar nova senha'],
    ['/privacidade', 'Política de privacidade'],
    ['/endereco-que-nao-existe', 'Página não encontrada'],
  ])('abre %s para o visitante', async (endereco, titulo) => {
    abrir(endereco);
    await esperarTitulo(titulo);
  });

  it('abre a página inicial e volta ao topo da página', async () => {
    abrir('/');
    await waitFor(() => expect(document.title).toBe('AulaCerta — Encontre um professor e agende sua aula'));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('rola até a seção quando o endereço tem #âncora', async () => {
    abrir('/#como-funciona');
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });

  it.each(['/minhas-aulas', '/meu-perfil', '/notificacoes', '/professores/p1/solicitar'])(
    'manda o visitante para o login ao abrir %s',
    async (endereco) => {
      abrir(endereco);
      await esperarTitulo('Entrar');
      expect(window.location.pathname).toBe('/entrar');
    },
  );

  it.each([
    ['/minhas-aulas', 'Minhas aulas'],
    ['/meu-perfil', 'Meu perfil'],
    ['/notificacoes', 'Notificações'],
    ['/professores/p1/solicitar', 'Solicitar aula'],
  ])('abre %s para quem está logado', async (endereco, titulo) => {
    salvarToken('token-valido');
    abrir(endereco);
    await esperarTitulo(titulo);
  });
});
