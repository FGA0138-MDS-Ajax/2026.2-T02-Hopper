import { useState } from 'react';
import { BellRing, Check } from 'lucide-react';
import { useLembretes, useMarcarComoLidas } from '../hooks/use-notificacoes';
import { mensagemDeErro } from '../services/api';
import { dataHoraCurta } from '../utils/datas';

/**
 * RF19: exibe em destaque os lembretes não lidos de aulas nas próximas 24 horas
 * para aluno e professor na página Minhas aulas.
 */
export function LembretesProximasAulas() {
  const { data: lembretes, isPending, isError } = useLembretes();
  const marcar = useMarcarComoLidas();
  const [erro, setErro] = useState<string | null>(null);

  if (isPending || isError || !lembretes || lembretes.length === 0) {
    return null;
  }

  async function marcarComoLido(id: string) {
    setErro(null);
    try {
      await marcar.mutateAsync([id]);
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível marcar o lembrete como lido.'));
    }
  }

  return (
    <section
      aria-labelledby="titulo-lembretes-24h"
      className="mt-6 rounded-2xl border border-secondary/30 bg-blue-50/70 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-secondary shadow-sm"
        >
          <BellRing size={18} />
        </span>
        <div className="min-w-0">
          <h2 id="titulo-lembretes-24h" className="text-base font-extrabold text-tinta">
            Lembretes das próximas 24 h
          </h2>
          <p className="text-xs text-suave">
            {lembretes.length === 1
              ? 'Você tem 1 aula prevista para as próximas 24 horas.'
              : `Você tem ${lembretes.length} aulas previstas para as próximas 24 horas.`}
          </p>
        </div>
      </div>

      {erro && (
        <p role="alert" className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-sm font-medium text-error">
          {erro}
        </p>
      )}

      <ul className="mt-4 space-y-2.5">
        {lembretes.map((lembrete) => (
          <li
            key={lembrete.id}
            className="flex flex-col gap-3 rounded-xl border border-secondary/20 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold text-tinta">{lembrete.mensagem}</p>
              <p className="mt-1 text-xs text-suave">{dataHoraCurta(lembrete.criadoEm)}</p>
            </div>
            <button
              type="button"
              onClick={() => marcarComoLido(lembrete.id)}
              disabled={marcar.isPending}
              className="foco inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-primary transition-colors hover:border-secondary hover:text-secondary disabled:opacity-60 sm:self-center"
            >
              <Check size={14} aria-hidden="true" />
              Marcar como lido
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
