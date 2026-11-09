import type { KeyboardEvent, ReactNode } from 'react';

export interface ItemDeAba<T extends string> {
  id: T;
  rotulo: string;
  /** Conteúdo extra ao lado do rótulo (ex.: contador). */
  complemento?: ReactNode;
}

/**
 * Lista de abas acessível (padrão WAI-ARIA): só a aba ativa entra no Tab,
 * e as setas esquerda/direita trocam de aba.
 */
export function Abas<T extends string>({
  abas,
  selecionada,
  aoEscolher,
  rotulo,
}: {
  abas: ItemDeAba<T>[];
  selecionada: T;
  aoEscolher: (id: T) => void;
  rotulo: string;
}) {
  function navegarComTeclado(evento: KeyboardEvent<HTMLDivElement>) {
    const passo = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (!passo) return;
    evento.preventDefault();
    const indice = abas.findIndex((aba) => aba.id === selecionada);
    const proxima = abas[(indice + passo + abas.length) % abas.length];
    aoEscolher(proxima.id);
    document.getElementById(`aba-${proxima.id}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={rotulo}
      onKeyDown={navegarComTeclado}
      className="flex gap-1 overflow-x-auto border-b border-slate-200"
    >
      {abas.map((aba) => {
        const ativa = aba.id === selecionada;
        return (
          <button
            key={aba.id}
            id={`aba-${aba.id}`}
            type="button"
            role="tab"
            aria-selected={ativa}
            aria-controls={`painel-${aba.id}`}
            tabIndex={ativa ? 0 : -1}
            onClick={() => aoEscolher(aba.id)}
            className={`foco -mb-px inline-flex shrink-0 items-center whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              ativa ? 'border-secondary text-secondary' : 'border-transparent text-suave hover:text-primary'
            }`}
          >
            {aba.rotulo}
            {aba.complemento}
          </button>
        );
      })}
    </div>
  );
}

/** Painel ligado à aba ativa. */
export function PainelDeAba({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  return (
    <div id={`painel-${id}`} role="tabpanel" aria-labelledby={`aba-${id}`} className={className}>
      {children}
    </div>
  );
}
