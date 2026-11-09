import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './logo';

const LINKS = [
  { href: '/#como-funciona', rotulo: 'Como funciona' },
  { href: '/professores', rotulo: 'Encontrar professores' },
  { href: '/#para-professores', rotulo: 'Sou professor' },
];

export function Cabecalho() {
  const [aberto, setAberto] = useState(false);

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

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/entrar" className="foco rounded-full px-4 py-2 text-sm font-bold text-primary hover:text-secondary">
            Entrar
          </Link>
          <Link to="/cadastro" className="botao-principal h-11 text-sm">
            Criar conta
          </Link>
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
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link to="/entrar" className="botao-secundario">
              Entrar
            </Link>
            <Link to="/cadastro" className="botao-principal">
              Criar conta
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
