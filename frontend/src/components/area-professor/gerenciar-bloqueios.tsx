import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarOff, RefreshCw } from 'lucide-react';
import { useBloqueios, useCriarBloqueio, useRemoverBloqueio } from '../../hooks/use-area-professor';
import { mensagemDeErro } from '../../services/api';
import type { Bloqueio } from '../../services/area-professor';
import { chaveDoDia, diaDaSemanaCurto, diaMes, diasConsecutivos, horaCurta, instanteEmBrasilia } from '../../utils/datas';
import { AlertaErro, BotaoEnviar } from '../layout-autenticacao';

const TAMANHO_MAXIMO_MOTIVO = 200;

const classeCampo =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-tinta focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30';

/** Período do bloqueio a partir do formulário, no horário de Brasília. Dia inteiro vai até a meia-noite seguinte. */
export function periodoDoBloqueio(dados: {
  dataInicio: string;
  dataFim: string;
  diaInteiro: boolean;
  horaInicio: string;
  horaFim: string;
}): { inicio: string; fim: string } {
  if (dados.diaInteiro) {
    const diaSeguinte = diasConsecutivos(dados.dataFim, 2)[1];
    return { inicio: instanteEmBrasilia(dados.dataInicio, '00:00'), fim: instanteEmBrasilia(diaSeguinte, '00:00') };
  }
  return {
    inicio: instanteEmBrasilia(dados.dataInicio, dados.horaInicio),
    fim: instanteEmBrasilia(dados.dataFim, dados.horaFim),
  };
}

const esquemaBloqueio = z
  .object({
    dataInicio: z.string().min(1, 'Informe o dia de início.'),
    dataFim: z.string().min(1, 'Informe o dia de fim.'),
    diaInteiro: z.boolean(),
    horaInicio: z.string(),
    horaFim: z.string(),
    motivo: z.string().trim().max(TAMANHO_MAXIMO_MOTIVO, `Use no máximo ${TAMANHO_MAXIMO_MOTIVO} caracteres.`),
  })
  .superRefine((dados, contexto) => {
    if (!dados.diaInteiro) {
      if (!dados.horaInicio) contexto.addIssue({ code: 'custom', path: ['horaInicio'], message: 'Informe a hora de início.' });
      if (!dados.horaFim) contexto.addIssue({ code: 'custom', path: ['horaFim'], message: 'Informe a hora de fim.' });
      if (!dados.horaInicio || !dados.horaFim) return;
    }
    if (!dados.dataInicio || !dados.dataFim) return;
    const { inicio, fim } = periodoDoBloqueio(dados);
    if (new Date(fim).getTime() <= new Date(inicio).getTime()) {
      contexto.addIssue({ code: 'custom', path: ['dataFim'], message: 'O fim precisa ser depois do início.' });
    } else if (new Date(inicio).getTime() <= Date.now()) {
      contexto.addIssue({
        code: 'custom',
        path: ['dataInicio'],
        message: dados.diaInteiro
          ? 'O bloqueio precisa começar no futuro. Para hoje, desmarque "Dia inteiro" e informe a partir de que horas.'
          : 'O bloqueio precisa começar no futuro.',
      });
    }
  });

type DadosBloqueio = z.infer<typeof esquemaBloqueio>;

function textoDoPeriodo(bloqueio: Bloqueio): string {
  const diaInicio = chaveDoDia(bloqueio.inicio);
  // Fim à meia-noite pertence ao dia anterior (bloqueio de "dia inteiro").
  const fimEhMeiaNoite = horaCurta(bloqueio.fim) === '0h';
  const diaFim = chaveDoDia(fimEhMeiaNoite ? new Date(new Date(bloqueio.fim).getTime() - 1) : bloqueio.fim);
  const rotuloDia = (dia: string) => `${diaDaSemanaCurto(dia)}, ${diaMes(dia)}`;
  const diaInteiro = horaCurta(bloqueio.inicio) === '0h' && fimEhMeiaNoite;

  if (diaInteiro) {
    return diaInicio === diaFim ? `${rotuloDia(diaInicio)} · dia inteiro` : `${rotuloDia(diaInicio)} a ${rotuloDia(diaFim)} · dias inteiros`;
  }
  if (diaInicio === diaFim) return `${rotuloDia(diaInicio)} · ${horaCurta(bloqueio.inicio)} às ${horaCurta(bloqueio.fim)}`;
  return `${rotuloDia(diaInicio)} ${horaCurta(bloqueio.inicio)} a ${rotuloDia(diaFim)} ${horaCurta(bloqueio.fim)}`;
}

function ItemDeBloqueio({ bloqueio, aoRemover }: { bloqueio: Bloqueio; aoRemover: (mensagem: string) => void }) {
  const remover = useRemoverBloqueio();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const periodo = textoDoPeriodo(bloqueio);

  async function confirmar() {
    setErro(null);
    try {
      await remover.mutateAsync(bloqueio.id);
      aoRemover(`Bloqueio de ${periodo} removido. Esses horários voltaram a ficar livres.`);
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível remover o bloqueio.'));
    }
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <CalendarOff size={18} className="mt-0.5 shrink-0 text-suave" aria-hidden="true" />
        <div>
          <p className="font-semibold text-tinta">{periodo}</p>
          {bloqueio.motivo && <p className="text-sm text-suave">{bloqueio.motivo}</p>}
          {erro && <p className="text-sm font-medium text-error">{erro}</p>}
        </div>
      </div>
      {confirmando ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-suave">Remover?</span>
          <button
            type="button"
            onClick={confirmar}
            disabled={remover.isPending}
            className="inline-flex h-10 items-center rounded-xl bg-error px-4 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {remover.isPending ? 'Removendo…' : 'Sim, remover'}
          </button>
          <button type="button" onClick={() => setConfirmando(false)} className="botao-secundario h-10 px-4 text-sm">
            Não
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="foco self-start rounded text-sm font-bold text-error hover:underline sm:self-auto"
          aria-label={`Remover bloqueio de ${periodo}`}
        >
          Remover
        </button>
      )}
    </li>
  );
}

/** RF06: exceções pontuais na grade (feriados, consultas, viagens). */
export function GerenciarBloqueios({ aoAlterar }: { aoAlterar: (mensagem: string) => void }) {
  const { data: bloqueios, isPending, isError, refetch } = useBloqueios();
  const criar = useCriarBloqueio();
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const hoje = chaveDoDia(new Date());

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<DadosBloqueio>({
    resolver: zodResolver(esquemaBloqueio),
    defaultValues: { dataInicio: '', dataFim: '', diaInteiro: true, horaInicio: '', horaFim: '', motivo: '' },
  });
  const diaInteiro = watch('diaInteiro');

  async function enviar(dados: DadosBloqueio) {
    setErroGeral(null);
    try {
      const novo = await criar.mutateAsync({ ...periodoDoBloqueio(dados), motivo: dados.motivo || undefined });
      reset();
      aoAlterar(`Bloqueio de ${textoDoPeriodo(novo)} criado. Os alunos não verão horários nesse período.`);
    } catch (erro) {
      setErroGeral(mensagemDeErro(erro, 'Não foi possível criar o bloqueio. Tente novamente.'));
    }
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="titulo-novo-bloqueio">
        <h2 id="titulo-novo-bloqueio" className="text-lg font-bold text-tinta">
          Novo bloqueio
        </h2>
        <p className="mt-1 max-w-xl text-sm text-suave">
          Use para feriados, compromissos ou viagens. Os horários do período somem da sua agenda pública. Aulas já
          confirmadas nesse período não são canceladas automaticamente.
        </p>

        <form onSubmit={handleSubmit(enviar)} noValidate className="mt-5 space-y-4">
          {erroGeral && <AlertaErro>{erroGeral}</AlertaErro>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bloqueio-inicio" className="text-sm font-semibold text-tinta">
                De
              </label>
              <input
                id="bloqueio-inicio"
                type="date"
                min={hoje}
                aria-invalid={errors.dataInicio ? true : undefined}
                className={`${classeCampo} mt-1.5`}
                {...register('dataInicio', {
                  onChange: (evento) => {
                    // Facilita o caso comum (um dia só): o fim acompanha o início.
                    if (!getValues('dataFim') || getValues('dataFim') < evento.target.value) {
                      setValue('dataFim', evento.target.value);
                    }
                  },
                })}
              />
              {errors.dataInicio && <p className="mt-1.5 text-sm font-medium text-error">{errors.dataInicio.message}</p>}
            </div>
            <div>
              <label htmlFor="bloqueio-fim" className="text-sm font-semibold text-tinta">
                Até
              </label>
              <input
                id="bloqueio-fim"
                type="date"
                min={hoje}
                aria-invalid={errors.dataFim ? true : undefined}
                className={`${classeCampo} mt-1.5`}
                {...register('dataFim')}
              />
              {errors.dataFim && <p className="mt-1.5 text-sm font-medium text-error">{errors.dataFim.message}</p>}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold text-tinta">
            <input type="checkbox" className="h-5 w-5 accent-secondary" {...register('diaInteiro')} />
            Dia inteiro
          </label>

          {!diaInteiro && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bloqueio-hora-inicio" className="text-sm font-semibold text-tinta">
                  A partir de
                </label>
                <input id="bloqueio-hora-inicio" type="time" className={`${classeCampo} mt-1.5`} {...register('horaInicio')} />
                {errors.horaInicio && <p className="mt-1.5 text-sm font-medium text-error">{errors.horaInicio.message}</p>}
              </div>
              <div>
                <label htmlFor="bloqueio-hora-fim" className="text-sm font-semibold text-tinta">
                  Até as
                </label>
                <input id="bloqueio-hora-fim" type="time" className={`${classeCampo} mt-1.5`} {...register('horaFim')} />
                {errors.horaFim && <p className="mt-1.5 text-sm font-medium text-error">{errors.horaFim.message}</p>}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="bloqueio-motivo" className="text-sm font-semibold text-tinta">
              Motivo <span className="font-normal text-suave">(opcional, só você vê)</span>
            </label>
            <input
              id="bloqueio-motivo"
              type="text"
              maxLength={TAMANHO_MAXIMO_MOTIVO}
              placeholder="Ex.: feriado, consulta médica"
              className={`${classeCampo} mt-1.5 px-4`}
              {...register('motivo')}
            />
          </div>

          <div className="sm:w-56">
            <BotaoEnviar enviando={isSubmitting} rotulo="Bloquear período" rotuloEnviando="Bloqueando…" />
          </div>
        </form>
      </section>

      <section aria-labelledby="titulo-bloqueios">
        <h2 id="titulo-bloqueios" className="text-lg font-bold text-tinta">
          Próximos bloqueios
        </h2>
        <div className="mt-4">
          {isPending && <p className="text-sm text-suave">Carregando…</p>}
          {isError && (
            <button type="button" onClick={() => refetch()} className="botao-secundario">
              <RefreshCw size={16} aria-hidden="true" />
              Tentar novamente
            </button>
          )}
          {bloqueios && bloqueios.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-suave">
              Nenhum bloqueio marcado.
            </p>
          )}
          {bloqueios && bloqueios.length > 0 && (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {bloqueios.map((bloqueio) => (
                <ItemDeBloqueio key={bloqueio.id} bloqueio={bloqueio} aoRemover={aoAlterar} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
