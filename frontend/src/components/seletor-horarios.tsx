import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import type { IntervaloApi, ProfessorDetalhe } from '../services/professores';
import {
  agruparPorDia,
  chaveDoDia,
  diaDaSemanaCurto,
  diaPorExtenso,
  diasConsecutivos,
  hora,
  horaCurta,
  intervaloDeDias,
} from '../utils/datas';

/** A API devolve os horários livres das próximas 4 semanas. */
const SEMANAS = 4;
const DIAS_POR_SEMANA = 7;

/** Link para o formulário de solicitação, com o horário escolhido. */
export function linkParaSolicitar(professorId: string, horario: IntervaloApi): string {
  const parametros = new URLSearchParams({ inicio: horario.inicio, fim: horario.fim });
  return `/professores/${professorId}/solicitar?${parametros.toString()}`;
}

function textoDeHorarios(quantidade: number): string {
  if (quantidade === 0) return 'sem horários';
  return quantidade === 1 ? '1 horário' : `${quantidade} horários`;
}

/** Semana, dia e horário: o aluno escolhe um bloco livre e segue para a solicitação. */
export function SeletorHorarios({ professor }: { professor: ProfessorDetalhe }) {
  const dias = useMemo(() => diasConsecutivos(chaveDoDia(new Date()), SEMANAS * DIAS_POR_SEMANA), []);
  const grupos = useMemo(() => agruparPorDia(professor.horariosLivres), [professor.horariosLivres]);

  const [diaSelecionado, setDiaSelecionado] = useState(() => dias.find((dia) => grupos.has(dia)) ?? dias[0]);
  const [horarioSelecionado, setHorarioSelecionado] = useState<IntervaloApi | null>(null);

  if (professor.horariosLivres.length === 0) {
    return (
      <div className="rounded-xl bg-surface p-5 text-center">
        <p className="font-bold text-tinta">Sem horários livres nas próximas 4 semanas.</p>
        <p className="mt-1 text-sm text-suave">Volte mais tarde ou procure outro professor.</p>
        <Link to="/professores" className="botao-secundario mt-4 h-11">
          Encontrar professores
        </Link>
      </div>
    );
  }

  const semana = Math.max(0, Math.floor(dias.indexOf(diaSelecionado) / DIAS_POR_SEMANA));
  const diasDaSemana = dias.slice(semana * DIAS_POR_SEMANA, (semana + 1) * DIAS_POR_SEMANA);
  const horariosDoDia = grupos.get(diaSelecionado) ?? [];

  function escolherDia(dia: string) {
    setDiaSelecionado(dia);
    setHorarioSelecionado(null);
  }

  function trocarSemana(passo: number) {
    const nova = semana + passo;
    const diasDaNova = dias.slice(nova * DIAS_POR_SEMANA, (nova + 1) * DIAS_POR_SEMANA);
    escolherDia(diasDaNova.find((dia) => grupos.has(dia)) ?? diasDaNova[0]);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => trocarSemana(-1)}
          disabled={semana === 0}
          className="foco inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <p className="text-center text-sm font-semibold tabular-nums text-tinta" aria-live="polite">
          {intervaloDeDias(diasDaSemana[0], diasDaSemana[diasDaSemana.length - 1])}
        </p>
        <button
          type="button"
          onClick={() => trocarSemana(1)}
          disabled={semana === SEMANAS - 1}
          className="foco inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Próxima semana"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <ul aria-label="Dias da semana" className="mt-4 grid grid-cols-7 gap-1">
        {diasDaSemana.map((dia) => {
          const quantidade = grupos.get(dia)?.length ?? 0;
          const selecionado = dia === diaSelecionado;
          return (
            <li key={dia}>
              <button
                type="button"
                onClick={() => escolherDia(dia)}
                disabled={quantidade === 0}
                aria-pressed={selecionado}
                aria-label={`${diaPorExtenso(dia)}, ${textoDeHorarios(quantidade)}`}
                className={`foco flex w-full flex-col items-center rounded-lg py-2 text-xs transition-colors disabled:cursor-not-allowed disabled:text-slate-400 ${
                  selecionado ? 'bg-secondary text-white' : 'text-tinta hover:bg-surface'
                }`}
              >
                <span className={selecionado ? 'text-blue-100' : 'text-suave'}>{diaDaSemanaCurto(dia)}</span>
                <span className="mt-0.5 text-sm font-bold tabular-nums">{dia.slice(8, 10)}</span>
                <span
                  aria-hidden="true"
                  className={`mt-1 h-1 w-1 rounded-full ${
                    quantidade === 0 ? 'bg-transparent' : selecionado ? 'bg-white' : 'bg-secondary'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 border-t border-slate-200 pt-5">
        {horariosDoDia.length > 0 ? (
          <>
            <p className="text-sm font-semibold text-tinta first-letter:uppercase">{diaPorExtenso(diaSelecionado)}</p>
            <ul aria-label="Horários livres" className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
              {horariosDoDia.map((horario) => {
                const selecionado = horarioSelecionado?.inicio === horario.inicio;
                return (
                  <li key={horario.inicio}>
                    <button
                      type="button"
                      onClick={() => setHorarioSelecionado(horario)}
                      aria-pressed={selecionado}
                      className={`foco h-11 w-full rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
                        selecionado
                          ? 'border-secondary bg-secondary text-white'
                          : 'border-slate-300 text-tinta hover:border-secondary hover:text-secondary'
                      }`}
                    >
                      {hora(horario.inicio)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-sm text-suave">Nenhum horário livre nesta semana. Veja a próxima.</p>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <p className="text-sm text-suave" aria-live="polite">
          {horarioSelecionado ? (
            <>
              Horário selecionado:{' '}
              <span className="font-bold text-tinta">
                {horaCurta(horarioSelecionado.inicio)} às {horaCurta(horarioSelecionado.fim)}
              </span>
            </>
          ) : (
            'Selecione um horário para continuar.'
          )}
        </p>
        {horarioSelecionado ? (
          <Link to={linkParaSolicitar(professor.id, horarioSelecionado)} className="botao-principal mt-3 w-full">
            Solicitar aula
          </Link>
        ) : (
          <button type="button" disabled className="botao-principal mt-3 w-full cursor-not-allowed opacity-50">
            Solicitar aula
          </button>
        )}
        <p className="mt-3 flex items-start gap-2 text-xs text-suave">
          <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Os dados de contato do professor ficam disponíveis após a confirmação da aula.
        </p>
      </div>
    </div>
  );
}
