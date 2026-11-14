import { useId, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSalvarGrade } from '../../hooks/use-area-professor';
import { mensagemDeErro } from '../../services/api';
import type { FaixaHoraria } from '../../services/area-professor';
import { AlertaErro, BotaoEnviar } from '../layout-autenticacao';
import { DIAS, minutos, validarGrade } from './regras';

const DIAS_UTEIS = [1, 2, 3, 4, 5];
const MAXIMO_DE_FAIXAS = 50;
const DURACAO_DA_AULA_MINUTOS = 60;

interface FaixaEditavel extends FaixaHoraria {
  chave: string;
}

let contador = 0;
function novaChave(): string {
  contador += 1;
  return `faixa-${contador}`;
}

function paraHora(totalMinutos: number): string {
  const limitado = Math.min(totalMinutos, 23 * 60 + 59);
  return `${String(Math.floor(limitado / 60)).padStart(2, '0')}:${String(limitado % 60).padStart(2, '0')}`;
}

/** Quantas aulas de 1 hora cabem na faixa (a API divide as faixas em blocos de 1 hora). */
function aulasNaFaixa(faixa: FaixaHoraria): number {
  return Math.max(0, Math.floor((minutos(faixa.horaFim) - minutos(faixa.horaInicio)) / DURACAO_DA_AULA_MINUTOS));
}

function comChave(faixas: FaixaHoraria[]): FaixaEditavel[] {
  return faixas.map((faixa) => ({ ...faixa, chave: novaChave() }));
}

function semChave(faixas: FaixaEditavel[]): FaixaHoraria[] {
  return faixas.map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim }));
}

/** RF05: grade semanal com uma ou mais faixas por dia. */
export function EditorGrade({ grade, aoSalvar }: { grade: FaixaHoraria[]; aoSalvar: (mensagem: string) => void }) {
  const salvar = useSalvarGrade();
  const [faixas, setFaixas] = useState<FaixaEditavel[]>(() => comChave(grade));
  const [erros, setErros] = useState<Map<number, string>>(new Map());
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const idDica = useId();

  const alterada = JSON.stringify(semChave(faixas)) !== JSON.stringify(grade);
  const totalDeAulas = faixas.reduce((soma, faixa) => soma + aulasNaFaixa(faixa), 0);

  function atualizar(chave: string, campo: 'horaInicio' | 'horaFim', valor: string) {
    setFaixas((atuais) => atuais.map((faixa) => (faixa.chave === chave ? { ...faixa, [campo]: valor } : faixa)));
  }

  function adicionar(diaSemana: number) {
    setFaixas((atuais) => {
      const doDia = atuais.filter((faixa) => faixa.diaSemana === diaSemana);
      const ultimoFim = doDia.reduce((maior, faixa) => Math.max(maior, minutos(faixa.horaFim || '00:00')), 0);
      const inicio = doDia.length === 0 ? 8 * 60 : ultimoFim;
      return [
        ...atuais,
        { chave: novaChave(), diaSemana, horaInicio: paraHora(inicio), horaFim: paraHora(inicio + 4 * 60) },
      ];
    });
  }

  function remover(chave: string) {
    setFaixas((atuais) => atuais.filter((faixa) => faixa.chave !== chave));
  }

  /** Repete os horários de segunda nos outros dias úteis (atalho comum para quem tem rotina fixa). */
  function repetirSegundaNosDiasUteis() {
    setFaixas((atuais) => {
      const segunda = atuais.filter((faixa) => faixa.diaSemana === 1);
      const foraDosDiasUteis = atuais.filter((faixa) => !DIAS_UTEIS.includes(faixa.diaSemana));
      const copias = DIAS_UTEIS.filter((dia) => dia !== 1).flatMap((dia) =>
        segunda.map((faixa) => ({ ...faixa, diaSemana: dia, chave: novaChave() })),
      );
      return [...foraDosDiasUteis, ...segunda, ...copias];
    });
  }

  async function enviar() {
    setErroGeral(null);
    const encontrados = validarGrade(faixas);
    setErros(encontrados);
    if (encontrados.size > 0) return;
    if (faixas.length > MAXIMO_DE_FAIXAS) {
      setErroGeral(`Use no máximo ${MAXIMO_DE_FAIXAS} faixas de horário.`);
      return;
    }
    try {
      const salva = await salvar.mutateAsync(semChave(faixas));
      setFaixas(comChave(salva));
      aoSalvar(
        salva.length > 0
          ? 'Grade salva. Os novos horários já aparecem para os alunos.'
          : 'Grade salva sem horários. Os alunos não conseguem pedir aulas até você adicionar horários.',
      );
    } catch (erro) {
      setErroGeral(mensagemDeErro(erro, 'Não foi possível salvar a grade. Tente novamente.'));
    }
  }

  const segundaTemHorarios = faixas.some((faixa) => faixa.diaSemana === 1);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p id={idDica} className="max-w-xl text-sm text-suave">
          Informe os períodos em que você dá aula, no horário de Brasília. As aulas têm 1 hora: um período das 8h às 12h
          gera 4 horários para os alunos escolherem.
        </p>
        <button
          type="button"
          onClick={repetirSegundaNosDiasUteis}
          disabled={!segundaTemHorarios}
          className="botao-secundario h-10 shrink-0 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Repetir segunda nos dias úteis
        </button>
      </div>

      {erroGeral && (
        <div className="mt-4">
          <AlertaErro>{erroGeral}</AlertaErro>
        </div>
      )}

      <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {DIAS.map((dia) => {
          const doDia = faixas.filter((faixa) => faixa.diaSemana === dia.valor);
          const erro = erros.get(dia.valor);
          const idErro = `erro-dia-${dia.valor}`;
          return (
            <li key={dia.valor} className="px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="sm:w-40 sm:pt-2.5">
                  <p className="font-semibold text-tinta">{dia.nome}</p>
                  <p className="text-xs text-suave">
                    {doDia.length === 0
                      ? 'Sem aulas'
                      : `${doDia.reduce((soma, faixa) => soma + aulasNaFaixa(faixa), 0)} horários de 1 h`}
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {doDia.map((faixa) => (
                    <div key={faixa.chave} className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`${faixa.chave}-inicio`}>
                        {dia.nome}: início
                      </label>
                      <input
                        id={`${faixa.chave}-inicio`}
                        type="time"
                        value={faixa.horaInicio}
                        onChange={(evento) => atualizar(faixa.chave, 'horaInicio', evento.target.value)}
                        aria-invalid={erro ? true : undefined}
                        aria-describedby={erro ? idErro : idDica}
                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 tabular-nums text-tinta focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30"
                      />
                      <span className="text-sm text-suave">às</span>
                      <label className="sr-only" htmlFor={`${faixa.chave}-fim`}>
                        {dia.nome}: fim
                      </label>
                      <input
                        id={`${faixa.chave}-fim`}
                        type="time"
                        value={faixa.horaFim}
                        onChange={(evento) => atualizar(faixa.chave, 'horaFim', evento.target.value)}
                        aria-invalid={erro ? true : undefined}
                        aria-describedby={erro ? idErro : idDica}
                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 tabular-nums text-tinta focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30"
                      />
                      <button
                        type="button"
                        onClick={() => remover(faixa.chave)}
                        className="foco inline-flex h-11 w-11 items-center justify-center rounded-xl text-suave hover:bg-error/10 hover:text-error"
                        aria-label={`Remover horário de ${dia.nome} das ${faixa.horaInicio} às ${faixa.horaFim}`}
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => adicionar(dia.valor)}
                    className="foco inline-flex h-10 items-center gap-1.5 rounded-lg px-1 text-sm font-bold text-secondary hover:underline"
                    aria-label={`Adicionar horário na ${dia.nome}`}
                  >
                    <Plus size={16} aria-hidden="true" />
                    Adicionar horário
                  </button>
                  {erro && (
                    <p id={idErro} className="text-sm font-medium text-error">
                      {erro}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-suave" aria-live="polite">
          {totalDeAulas} {totalDeAulas === 1 ? 'horário' : 'horários'} de aula por semana
          {alterada && <span className="font-semibold text-amber-800"> · alterações não salvas</span>}
        </p>
        <div className="sm:w-56">
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviar();
            }}
          >
            <BotaoEnviar enviando={salvar.isPending} rotulo="Salvar grade" rotuloEnviando="Salvando…" />
          </form>
        </div>
      </div>
    </div>
  );
}
