import { ROTULO_STATUS, type StatusAula } from '../services/aulas';

/** Cores dos status definidas no DESIGN.md (seção "Status da aula"). */
const CLASSE_DO_STATUS: Record<StatusAula, string> = {
  SOLICITADA: 'bg-ambar/15 text-amber-800',
  CONFIRMADA: 'bg-menta/15 text-emerald-800',
  REMARCADA: 'bg-ceu/15 text-sky-800',
  RECUSADA: 'bg-error/10 text-error',
  CANCELADA: 'bg-error/10 text-error',
  REALIZADA: 'bg-slate-100 text-slate-700',
};

export function SeloStatus({ status }: { status: StatusAula }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${CLASSE_DO_STATUS[status]}`}>
      {ROTULO_STATUS[status]}
    </span>
  );
}
