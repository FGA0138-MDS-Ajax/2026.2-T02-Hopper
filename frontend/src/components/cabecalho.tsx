import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSessao } from '../contexts/sessao';
import { Logo } from './logo';
import { iniciais } from './professor-info';

const LINKS = [
  { href: '/#como-funciona', rotulo: 'Como funciona' },
  { href: '/professores', rotulo: 'Encontrar professores' },
  { href: '/#para-professores', rotulo: 'Sou professor' },
];

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const { usuario, carregando, sair } = useSessao();
  const navegar = useNavigate();

  function sairDaConta() {
    setAberto(false);
    sair();
    navegar('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-surface/85 backdrop-blur">
      <div className="conteudo flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link to="/" className="foco rounded-xl" aria-label="AulaCerta, página inicial">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="foco rounded-lg text-sm font-semibold text-suave transition-colors hover:text-primary"
            >
              {link.rotulo}
            </a>
          ))}
        </nav>

        {/* Enquanto confirma a sessão, o espaço fica vazio para não piscar "Entrar" para quem já está logado. */}
        <div className="hidden min-w-[12rem] items-center justify-end gap-2 md:flex">
          {usuario ? (
            <>
              {usuario.perfil !== 'ADMIN' && (
                <Link to="/minhas-aulas" className="botao-principal mr-2 h-10 px-4 text-sm">
                  Minhas aulas
                </Link>
              )}
              <span className="flex items-center gap-2 text-sm font-semibold text-tinta">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-secondary"
                >
                  {iniciais(usuario.nome)}
                </span>
                Olá, {primeiroNome(usuario.nome)}
              </span>
              <button
                type="button"
                onClick={sairDaConta}
                className="foco rounded-xl px-3 py-2 text-sm font-bold text-primary hover:text-secondary"
              >
                Sair
              </button>
            </>
          ) : (
            !carregando && (
              <>
                <Link to="/entrar" className="foco rounded-xl px-4 py-2 text-sm font-bold text-primary hover:text-secondary">
                  Entrar
                </Link>
                <Link to="/cadastro" className="botao-principal h-11 text-sm">
                  Criar conta
                </Link>
              </>
            )
          )}
        </div>

        <button
          type="button"
          className="foco -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-primary md:hidden"
          aria-expanded={aberto}
          aria-controls="menu-movel"
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setAberto((valor) => !valor)}
        >
          {aberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {aberto && (
        <nav id="menu-movel" aria-label="Principal" className="conteudo flex flex-col gap-1 pb-5 md:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setAberto(false)}
              className="foco rounded-xl px-3 py-3 font-semibold text-tinta hover:bg-white"
            >
              {link.rotulo}
            </a>
          ))}
          {usuario ? (
            <>
              {usuario.perfil !== 'ADMIN' && (
                <Link to="/minhas-aulas" onClick={() => setAberto(false)} className="botao-principal mt-2">
                  Minhas aulas
                </Link>
              )}
              <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-3 py-3">
                <span className="text-sm font-semibold text-tinta">Olá, {primeiroNome(usuario.nome)}</span>
                <button type="button" onClick={sairDaConta} className="foco rounded-lg text-sm font-bold text-primary">
                  Sair
                </button>
              </div>
            </>
          ) : (
            !carregando && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/entrar" className="botao-secundario">
                  Entrar
                </Link>
                <Link to="/cadastro" className="botao-principal">
                  Criar conta
                </Link>
              </div>
            )
          )}
        </nav>
      )}
    </header>
  );
}
