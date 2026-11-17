import { ChevronLeft, ChevronRight } from 'lucide-react';

/** "Anterior / Página X de Y / Próxima". Não aparece quando tudo cabe numa página. */
export function Paginacao({
  pagina,
  totalDePaginas,
  aoMudar,
  className = 'mt-8',
}: {
  pagina: number;
  totalDePaginas: number;
  aoMudar: (pagina: number) => void;
  className?: string;
}) {
  if (totalDePaginas <= 1) return null;
  const atual = Math.min(pagina, totalDePaginas);

  return (
    <nav aria-label="Paginação" className={`flex items-center justify-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={() => aoMudar(atual - 1)}
        disabled={atual <= 1}
        className="botao-secundario h-11 px-4 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={18} aria-hidden="true" />
        Anterior
      </button>
      <p className="min-w-28 text-center text-sm font-semibold tabular-nums text-suave">
        Página {atual} de {totalDePaginas}
      </p>
      <button
        type="button"
        onClick={() => aoMudar(atual + 1)}
        disabled={atual >= totalDePaginas}
        className="botao-secundario h-11 px-4 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Próxima
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
