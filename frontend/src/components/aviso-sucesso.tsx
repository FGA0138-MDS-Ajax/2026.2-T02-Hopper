import type { ReactNode } from 'react';
import { CircleCheck, X } from 'lucide-react';

/** Confirmação de uma ação (anunciada por leitores de tela), com botão para fechar. */
export function AvisoSucesso({ children, aoFechar }: { children: ReactNode; aoFechar: () => void }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-menta/30 bg-menta/10 px-4 py-3 text-sm text-emerald-900"
    >
      <CircleCheck size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
      <p className="flex-1">{children}</p>
      <button type="button" onClick={aoFechar} className="foco rounded text-emerald-800" aria-label="Fechar aviso">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
