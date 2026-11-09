import { Link } from 'react-router-dom';
import { useSessao } from '../contexts/sessao';
import { Logo } from './logo';

export function Rodape() {
  const { usuario } = useSessao();
  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="conteudo flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-suave">
            Encontre professores, agende aulas particulares e organize seus estudos.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-suave">
          <a href="/#como-funciona" className="foco rounded hover:text-primary">
            Como funciona
          </a>
          <Link to="/professores" className="foco rounded hover:text-primary">
            Encontrar professores
          </Link>
          <a href="/#para-professores" className="foco rounded hover:text-primary">
            Sou professor
          </a>
          {!usuario && (
            <Link to="/entrar" className="foco rounded hover:text-primary">
              Entrar
            </Link>
          )}
        </nav>
      </div>
      <div className="border-t border-slate-100">
        <div className="conteudo flex flex-col gap-3 py-5 text-xs text-suave sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p>© 2026 AulaCerta · Grupo Hopper</p>
            <p>Projeto desenvolvido na disciplina de Métodos de Desenvolvimento de Software — UnB/FCTE.</p>
          </div>
          <Link to="/privacidade" className="foco rounded font-semibold hover:text-primary">
            Política de privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
