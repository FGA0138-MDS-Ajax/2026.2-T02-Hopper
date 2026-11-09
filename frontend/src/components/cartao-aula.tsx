import { useId, useState } from 'react';
import { ChevronDown, Clock, Lock, Mail, Phone } from 'lucide-react';
import { useAceitarAula, useAula, useRecusarAula } from '../hooks/use-aulas';
import { mensagemDeErro } from '../services/api';
import { ROTULO_STATUS, type Aula } from '../services/aulas';
import { ROTULO_MODALIDADE } from '../services/professores';
import { chaveDoDia, dataHoraCurta, diaDaSemanaCurto, horaCurta, mesCurto } from '../utils/datas';
import { ICONE_MODALIDADE } from './professor-info';
import { SeloStatus } from './selo-status';

export type Papel = 'ALUNO' | 'PROFESSOR';

const TAMANHO_MAXIMO_MOTIVO = 300;

/** "(61) 99111-0001" a partir de "61991110001". */
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  if (numeros.length === 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return telefone;
}

function BlocoDeData({ inicio }: { inicio: string }) {
  const chave = chaveDoDia(inicio);
  return (
    <div
      aria-hidden="true"
      className="flex w-16 shrink-0 flex-col items-center rounded-xl border border-slate-200 bg-surface py-2"
    >
      <span className="text-xs font-semibold uppercase text-suave">{diaDaSemanaCurto(chave)}</span>
      <span className="text-2xl font-extrabold leading-tight tabular-nums text-tinta">{chave.slice(8, 10)}</span>
      <span className="text-xs font-semibold uppercase text-suave">{mesCurto(chave)}</span>
    </div>
  );
}

function Detalhes({ aula, papel }: { aula: Aula; papel: Papel }) {
  const { data, isPending, isError, refetch } = useAula(aula.id, true);
  const quem = papel === 'ALUNO' ? 'do professor' : 'do aluno';

  if (isPending) return <p className="text-sm text-suave">Carregando detalhes…</p>;
  if (isError || !data) {
    return (
      <p className="text-sm text-error">
        Não foi possível carregar os detalhes.{' '}
        <button type="button" onClick={() => refetch()} className="foco rounded font-bold underline">
          Tentar novamente
        </button>
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section aria-label="Contato">
        <h4 className="text-sm font-bold text-tinta">Contato {quem}</h4>
        {data.contato ? (
          <ul className="mt-2 space-y-1.5 text-sm">
            <li className="font-semibold text-tinta">{data.contato.nome}</li>
            <li>
              <a
                href={`mailto:${data.contato.email}`}
                className="foco inline-flex items-center gap-2 rounded text-secondary hover:underline"
              >
                <Mail size={15} aria-hidden="true" />
                {data.contato.email}
              </a>
            </li>
            {data.contato.telefone && (
              <li>
                <a
                  href={`tel:+55${data.contato.telefone}`}
                  className="foco inline-flex items-center gap-2 rounded text-secondary hover:underline"
                >
                  <Phone size={15} aria-hidden="true" />
                  {formatarTelefone(data.contato.telefone)}
                </a>
              </li>
            )}
          </ul>
        ) : (
          <p className="mt-2 flex items-start gap-2 text-sm text-suave">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {data.status === 'SOLICITADA'
              ? 'O contato aparece depois que a aula for confirmada.'
              : 'O contato não fica disponível para aulas recusadas ou canceladas.'}
          </p>
        )}
      </section>

      <section aria-label="Histórico da aula">
        <h4 className="text-sm font-bold text-tinta">Histórico</h4>
        <ol className="mt-2 space-y-2">
          {data.historico.map((item) => (
            <li key={`${item.status}-${item.dataHora}`} className="text-sm">
              <span className="font-semibold text-tinta">{ROTULO_STATUS[item.status]}</span>{' '}
              <span className="text-suave">em {dataHoraCurta(item.dataHora)}</span>
              {item.motivo && <span className="block text-suave">Motivo: {item.motivo}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function AcoesDoProfessor({
  aula,
  aoConcluir,
}: {
  aula: Aula;
  aoConcluir: (mensagem: string) => void;
}) {
  const aceitar = useAceitarAula();
  const recusar = useRecusarAula();
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const idMotivo = useId();
  const ocupado = aceitar.isPending || recusar.isPending;

  async function confirmarAula() {
    setErro(null);
    try {
      await aceitar.mutateAsync(aula.id);
      aoConcluir(`Aula com ${aula.aluno.nome} confirmada. O horário ficou reservado e o aluno foi avisado.`);
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível confirmar a aula. Tente novamente.'));
    }
  }

  async function recusarAula() {
    setErro(null);
    try {
      await recusar.mutateAsync({ id: aula.id, motivo: motivo.trim() || undefined });
      aoConcluir(`Pedido de ${aula.aluno.nome} recusado. O aluno foi avisado.`);
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível recusar o pedido. Tente novamente.'));
    }
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      {erro && (
        <p role="alert" className="mb-3 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
          {erro}
        </p>
      )}
      {recusando ? (
        <div>
          <label htmlFor={idMotivo} className="text-sm font-semibold text-tinta">
            Motivo da recusa <span className="font-normal text-suave">(opcional, o aluno verá)</span>
          </label>
          <textarea
            id={idMotivo}
            rows={2}
            maxLength={TAMANHO_MAXIMO_MOTIVO}
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder="Ex.: neste dia não consigo atender presencialmente."
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-tinta placeholder:text-slate-400 focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={recusarAula}
              disabled={ocupado}
              className="inline-flex h-11 items-center rounded-xl bg-error px-5 text-sm font-bold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/30 disabled:opacity-60"
            >
              {recusar.isPending ? 'Recusando…' : 'Confirmar recusa'}
            </button>
            <button
              type="button"
              onClick={() => setRecusando(false)}
              disabled={ocupado}
              className="botao-secundario h-11 px-5 text-sm"
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={confirmarAula} disabled={ocupado} className="botao-principal h-11 px-5 text-sm disabled:opacity-60">
            {aceitar.isPending ? 'Confirmando…' : 'Aceitar'}
          </button>
          <button
            type="button"
            onClick={() => setRecusando(true)}
            disabled={ocupado}
            className="botao-secundario h-11 px-5 text-sm"
          >
            Recusar
          </button>
        </div>
      )}
    </div>
  );
}

/** Uma aula na lista "Minhas aulas": quem, quando, como e o status; o professor responde os pedidos aqui. */
export function CartaoAula({
  aula,
  papel,
  aoConcluirAcao,
}: {
  aula: Aula;
  papel: Papel;
  aoConcluirAcao: (mensagem: string) => void;
}) {
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const idDetalhes = useId();
  const IconeModalidade = ICONE_MODALIDADE[aula.modalidade];
  const outro = papel === 'ALUNO' ? `com ${aula.professor.nome}` : `Aluno: ${aula.aluno.nome}`;
  const aguardandoResposta = aula.status === 'SOLICITADA' && new Date(aula.inicio).getTime() > Date.now();

  return (
    <article className="cartao p-4 sm:p-5" aria-label={`Aula de ${aula.materia.nome}, ${outro}`}>
      <div className="flex gap-4">
        <BlocoDeData inicio={aula.inicio} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-tinta">
                {aula.materia.nome} <span className="font-normal text-suave">· {aula.materia.nivel}</span>
              </h3>
              <p className="text-sm text-suave">{outro}</p>
            </div>
            <SeloStatus status={aula.status} />
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-suave">
            <li className="inline-flex items-center gap-1.5">
              <Clock size={14} aria-hidden="true" />
              {horaCurta(aula.inicio)} às {horaCurta(aula.fim)}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <IconeModalidade size={14} aria-hidden="true" />
              {ROTULO_MODALIDADE[aula.modalidade]}
            </li>
          </ul>
          {aula.objetivo && <p className="mt-2 line-clamp-2 text-sm text-tinta">“{aula.objetivo}”</p>}
        </div>
      </div>

      {papel === 'PROFESSOR' && aguardandoResposta && <AcoesDoProfessor aula={aula} aoConcluir={aoConcluirAcao} />}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setDetalhesAbertos((valor) => !valor)}
          aria-expanded={detalhesAbertos}
          aria-controls={idDetalhes}
          className="foco inline-flex items-center gap-1 rounded text-sm font-bold text-secondary hover:underline"
        >
          {detalhesAbertos ? 'Ocultar detalhes' : 'Ver detalhes'}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`transition-transform ${detalhesAbertos ? 'rotate-180' : ''}`}
          />
        </button>
        {detalhesAbertos && (
          <div id={idDetalhes} className="mt-4 rounded-xl bg-surface p-4">
            <Detalhes aula={aula} papel={papel} />
          </div>
        )}
      </div>
    </article>
  );
}
