import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessao } from '../contexts/sessao';
import { comVoltar } from '../utils/redirecionamento';

/** Telas que exigem login: o visitante vai para /entrar e, depois de entrar, volta para cá. */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useSessao();
  const local = useLocation();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <span className="sr-only">Carregando…</span>
        <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-secondary" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to={comVoltar('/entrar', local.pathname + local.search)} replace />;
  }

  return <>{children}</>;
}
