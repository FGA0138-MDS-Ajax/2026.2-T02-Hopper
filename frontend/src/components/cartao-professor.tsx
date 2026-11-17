import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ProfessorPublico } from '../services/professores';
import { formatarReais } from '../utils/formatacao';
import { AvatarProfessor, ListaModalidades } from './professor-info';

const MAXIMO_MATERIAS = 3;

export function CartaoProfessor({ professor }: { professor: ProfessorPublico }) {
  const materiasVisiveis = professor.materias.slice(0, MAXIMO_MATERIAS);
  const restantes = professor.materias.length - materiasVisiveis.length;

  return (
    <article className="cartao flex h-full flex-col p-6 transition-colors hover:border-slate-300">
      <div className="flex items-start gap-4">
        <AvatarProfessor id={professor.id} nome={professor.nome} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-tinta">{professor.nome}</h3>
          <div className="mt-1">
            <ListaModalidades modalidades={professor.modalidades} />
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-suave">{professor.apresentacao}</p>

      <ul aria-label="Matérias" className="mt-4 flex flex-wrap gap-2">
        {materiasVisiveis.map((materia) => (
          <li key={materia.id} className="rounded-md bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
            {materia.nome} · {materia.nivel}
          </li>
        ))}
        {restantes > 0 && (
          <li className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-suave">+{restantes}</li>
        )}
      </ul>

      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <p className="text-sm text-suave">
          {professor.valorHora !== null ? (
            <>
              <span className="text-2xl font-extrabold tabular-nums text-tinta">
                {formatarReais.format(professor.valorHora)}
              </span>
              /h
            </>
          ) : (
            'Valor a consultar'
          )}
        </p>
        <Link
          to={`/professores/${professor.id}`}
          className="foco inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-sm font-bold text-primary transition-colors hover:border-secondary hover:text-secondary"
          aria-label={`Ver horários de ${professor.nome}`}
        >
          Ver horários
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function CartaoProfessorEsqueleto() {
  return (
    <div className="cartao animate-pulse p-6" aria-hidden="true">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-28 rounded-md bg-slate-100" />
        <div className="h-6 w-20 rounded-md bg-slate-100" />
      </div>
      <div className="mt-8 h-8 w-24 rounded bg-slate-200" />
    </div>
  );
}
