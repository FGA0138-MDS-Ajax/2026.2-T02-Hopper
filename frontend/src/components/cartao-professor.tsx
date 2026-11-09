import { Link } from 'react-router-dom';
import { ArrowRight, House, MapPin, Monitor } from 'lucide-react';
import { ROTULO_MODALIDADE, type Modalidade, type ProfessorPublico } from '../services/professores';

const ICONE_MODALIDADE: Record<Modalidade, typeof Monitor> = {
  ONLINE: Monitor,
  PRESENCIAL: MapPin,
  DOMICILIO: House,
};

const CORES_AVATAR = [
  'bg-secondary text-white',
  'bg-menta text-primary',
  'bg-ceu text-primary',
  'bg-primary text-white',
];

const MAXIMO_MATERIAS = 3;

const formatarReais = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

function corDoAvatar(id: string): string {
  let soma = 0;
  for (const caractere of id) soma += caractere.charCodeAt(0);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

export function CartaoProfessor({ professor }: { professor: ProfessorPublico }) {
  const materiasVisiveis = professor.materias.slice(0, MAXIMO_MATERIAS);
  const restantes = professor.materias.length - materiasVisiveis.length;

  return (
    <article className="cartao flex h-full flex-col p-6 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${corDoAvatar(professor.id)}`}
        >
          {iniciais(professor.nome)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-tinta">{professor.nome}</h3>
          <ul aria-label="Modalidades" className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-suave">
            {professor.modalidades.map((modalidade) => {
              const Icone = ICONE_MODALIDADE[modalidade];
              return (
                <li key={modalidade} className="inline-flex items-center gap-1">
                  <Icone size={14} aria-hidden="true" />
                  {ROTULO_MODALIDADE[modalidade]}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-suave">{professor.apresentacao}</p>

      <ul aria-label="Matérias" className="mt-4 flex flex-wrap gap-2">
        {materiasVisiveis.map((materia) => (
          <li key={materia.id} className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            {materia.nome} · {materia.nivel}
          </li>
        ))}
        {restantes > 0 && (
          <li className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-suave">+{restantes}</li>
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
          className="foco inline-flex h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-bold text-primary transition-colors hover:bg-secondary hover:text-white"
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
        <div className="h-14 w-14 rounded-2xl bg-slate-200" />
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
        <div className="h-6 w-28 rounded-full bg-slate-100" />
        <div className="h-6 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="mt-8 h-8 w-24 rounded bg-slate-200" />
    </div>
  );
}
