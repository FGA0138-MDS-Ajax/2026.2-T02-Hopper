import { useId, useState } from 'react';
import { BellRing, ChevronDown, Clock, Lock, Mail, Phone, Repeat } from 'lucide-react';
import {
  useAceitarAula,
  useAula,
  useCancelarAula,
  useProporRemarcacao,
  useRecusarAula,
  useResponderRemarcacao,
} from '../hooks/use-aulas';
import { mensagemDeErro } from '../services/api';
import { ROTULO_STATUS, type Aula } from '../services/aulas';
import { ROTULO_MODALIDADE } from '../services/professores';
import {
  chaveDoDia,
  dataHoraCurta,
  diaDaSemanaCurto,
  hora,
  horaCurta,
  instanteEmBrasilia,
  mesCurto,
} from '../utils/datas';
import { formatarTelefone } from '../utils/formatacao';
import { ICONE_MODALIDADE } from '../utils/modalidades';
import { SeloStatus } from './selo-status';

export type Papel = 'ALUNO' | 'PROFESSOR';

const TAMANHO_MAXIMO_MOTIVO = 300;

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

function AcoesDoProfessor({ aula, aoConcluir }: { aula: Aula; aoConcluir: (mensagem: string) => void }) {
  const aceitar = useAceitarAula();
  const recusar = useRecusarAula();
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const idMotivo = useId();
  const ocupado = aceitar.isPending || recusar.isPending;

  async function confirmarAula(serie = false) {
    setErro(null);
    try {
      await aceitar.mutateAsync({ id: aula.id, serie });
      aoConcluir(
        serie
          ? `Aulas semanais com ${aula.aluno.nome} confirmadas. Os horários ficaram reservados e o aluno foi avisado.`
          : `Aula com ${aula.aluno.nome} confirmada. O horário ficou reservado e o aluno foi avisado.`,
      );
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
          <button
            type="button"
            onClick={() => confirmarAula()}
            disabled={ocupado}
            className="botao-principal h-11 px-5 text-sm disabled:opacity-60"
          >
            {aceitar.isPending ? 'Confirmando…' : aula.serieId ? 'Aceitar esta aula' : 'Aceitar'}
          </button>
          {aula.serieId && (
            <button
              type="button"
              onClick={() => confirmarAula(true)}
              disabled={ocupado}
              className="botao-secundario h-11 px-5 text-sm disabled:opacity-60"
            >
              Aceitar a série inteira
            </button>
          )}
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

function FormularioRemarcar({
  aula,
  papel,
  onCancelar,
  aoConcluir,
}: {
  aula: Aula;
  papel: Papel;
  onCancelar: () => void;
  aoConcluir: (mensagem: string) => void;
}) {
  const propor = useProporRemarcacao();
  const [novaData, setNovaData] = useState(() => chaveDoDia(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [novoInicioHora, setNovoInicioHora] = useState(() => hora(aula.inicio));
  const [novoFimHora, setNovoFimHora] = useState(() => hora(aula.fim));
  const [erro, setErro] = useState<string | null>(null);

  const idData = useId();
  const idInicio = useId();
  const idFim = useId();

  const outroNome = papel === 'ALUNO' ? aula.professor.nome : aula.aluno.nome;
  const hoje = chaveDoDia(new Date());

  async function enviarProposta() {
    setErro(null);
    if (!novaData || !novoInicioHora || !novoFimHora) {
      setErro('Preencha a data e os horários para remarcar.');
      return;
    }

    const novoInicioIso = instanteEmBrasilia(novaData, novoInicioHora);
    const novoFimIso = instanteEmBrasilia(novaData, novoFimHora);

    if (new Date(novoInicioIso).getTime() <= Date.now()) {
      setErro('O novo horário deve ser no futuro.');
      return;
    }

    if (new Date(novoFimIso).getTime() <= new Date(novoInicioIso).getTime()) {
      setErro('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    try {
      await propor.mutateAsync({
        aulaId: aula.id,
        dados: { novoInicio: novoInicioIso, novoFim: novoFimIso },
      });
      aoConcluir(
        papel === 'ALUNO'
          ? `Proposta de remarcação enviada ao professor ${aula.professor.nome}.`
          : `Proposta de remarcação enviada ao aluno ${aula.aluno.nome}.`,
      );
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível enviar a proposta de remarcação. Tente novamente.'));
    }
  }

  return (
    <div>
      {erro && (
        <p role="alert" className="mb-3 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
          {erro}
        </p>
      )}
      <h4 className="text-sm font-bold text-tinta">Propor novo horário</h4>
      <p className="mt-0.5 text-xs text-suave">
        O horário atual permanecerá reservado até que {outroNome} aprove a proposta.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={idData} className="block text-xs font-semibold text-tinta">
            Nova data
          </label>
          <input
            id={idData}
            type="date"
            min={hoje}
            value={novaData}
            onChange={(e) => {
              setNovaData(e.target.value);
              if (erro) setErro(null);
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-tinta focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/30"
          />
        </div>
        <div>
          <label htmlFor={idInicio} className="block text-xs font-semibold text-tinta">
            Início
          </label>
          <input
            id={idInicio}
            type="time"
            value={novoInicioHora}
            onChange={(e) => {
              setNovoInicioHora(e.target.value);
              if (erro) setErro(null);
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-tinta focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/30"
          />
        </div>
        <div>
          <label htmlFor={idFim} className="block text-xs font-semibold text-tinta">
            Término
          </label>
          <input
            id={idFim}
            type="time"
            value={novoFimHora}
            onChange={(e) => {
              setNovoFimHora(e.target.value);
              if (erro) setErro(null);
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-tinta focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/30"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={enviarProposta}
          disabled={propor.isPending}
          className="botao-principal h-11 px-5 text-sm disabled:opacity-60"
        >
          {propor.isPending ? 'Enviando proposta…' : 'Enviar proposta'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={propor.isPending}
          className="botao-secundario h-11 px-5 text-sm"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}

function FormularioCancelar({
  aula,
  papel,
  onVoltar,
  aoConcluir,
}: {
  aula: Aula;
  papel: Papel;
  onVoltar: () => void;
  aoConcluir: (mensagem: string) => void;
}) {
  const cancelar = useCancelarAula();
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const idMotivo = useId();

  const ehPedido = aula.status === 'SOLICITADA';

  async function confirmarCancelamento() {
    const motivoLimpo = motivo.trim();
    if (motivoLimpo.length < 3) {
      setErro('Informe o motivo do cancelamento (mínimo de 3 caracteres).');
      return;
    }
    setErro(null);
    try {
      await cancelar.mutateAsync({ id: aula.id, motivo: motivoLimpo });
      if (ehPedido) {
        aoConcluir('Pedido de aula cancelado.');
      } else if (papel === 'ALUNO') {
        aoConcluir(`Aula com ${aula.professor.nome} cancelada. O horário foi liberado e o professor foi avisado.`);
      } else {
        aoConcluir(`Aula com ${aula.aluno.nome} cancelada. O horário foi liberado e o aluno foi avisado.`);
      }
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível cancelar a aula. Tente novamente.'));
    }
  }

  return (
    <div>
      {erro && (
        <p role="alert" className="mb-3 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
          {erro}
        </p>
      )}
      <label htmlFor={idMotivo} className="text-sm font-semibold text-tinta">
        Motivo do cancelamento <span className="text-error">*</span>
      </label>
      <textarea
        id={idMotivo}
        rows={2}
        maxLength={TAMANHO_MAXIMO_MOTIVO}
        value={motivo}
        onChange={(evento) => {
          setMotivo(evento.target.value);
          if (erro) setErro(null);
        }}
        placeholder={
          ehPedido
            ? 'Ex.: Não poderei mais no horário solicitado.'
            : 'Ex.: Tive um imprevisto e precisarei cancelar esta aula.'
        }
        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-tinta placeholder:text-slate-400 focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={confirmarCancelamento}
          disabled={cancelar.isPending}
          className="inline-flex h-11 items-center rounded-xl bg-error px-5 text-sm font-bold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/30 disabled:opacity-60"
        >
          {cancelar.isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
        </button>
        <button
          type="button"
          onClick={onVoltar}
          disabled={cancelar.isPending}
          className="botao-secundario h-11 px-5 text-sm"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}

function AcoesDaAula({
  aula,
  papel,
  podeRemarcar,
  podeCancelar,
  aoConcluir,
}: {
  aula: Aula;
  papel: Papel;
  podeRemarcar: boolean;
  podeCancelar: boolean;
  aoConcluir: (mensagem: string) => void;
}) {
  const [modo, setModo] = useState<'nenhum' | 'remarcar' | 'cancelar'>('nenhum');
  const responder = useResponderRemarcacao();
  const [erroResposta, setErroResposta] = useState<string | null>(null);

  const remarcacaoPendente = aula.remarcacaoPendente;
  const usuarioId = papel === 'ALUNO' ? aula.aluno.id : aula.professor.usuarioId;
  const outroNome = papel === 'ALUNO' ? aula.professor.nome : aula.aluno.nome;

  if (remarcacaoPendente && remarcacaoPendente.aceita === null) {
    const euPropus = remarcacaoPendente.propostoPorId === usuarioId;

    if (euPropus) {
      return (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-tinta">
            <p className="font-semibold text-primary">Proposta de novo horário enviada</p>
            <p className="mt-1 text-suave">
              Você propôs remarcar para{' '}
              <strong className="text-tinta">
                {dataHoraCurta(remarcacaoPendente.novoInicio)} às {horaCurta(remarcacaoPendente.novoFim)}
              </strong>
              . Aguardando resposta de {outroNome}. O horário atual continua reservado até a decisão.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="rounded-xl border border-secondary/30 bg-surface-container-low p-4 text-sm text-tinta">
          {erroResposta && (
            <p role="alert" className="mb-3 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
              {erroResposta}
            </p>
          )}
          <p className="font-bold text-primary">Proposta de remarcação recebida</p>
          <p className="mt-1 text-suave">
            {outroNome} propôs alterar o horário desta aula para{' '}
            <strong className="text-tinta">
              {dataHoraCurta(remarcacaoPendente.novoInicio)} às {horaCurta(remarcacaoPendente.novoFim)}
            </strong>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                setErroResposta(null);
                try {
                  await responder.mutateAsync({ aulaId: aula.id, remarcacaoId: remarcacaoPendente.id, aceita: true });
                  aoConcluir('Proposta de remarcação aceita. O novo horário foi reservado.');
                } catch (falha) {
                  setErroResposta(mensagemDeErro(falha, 'Não foi possível aceitar a remarcação. Tente novamente.'));
                }
              }}
              disabled={responder.isPending}
              className="botao-principal h-11 px-5 text-sm disabled:opacity-60"
            >
              {responder.isPending ? 'Confirmando…' : 'Aceitar novo horário'}
            </button>
            <button
              type="button"
              onClick={async () => {
                setErroResposta(null);
                try {
                  await responder.mutateAsync({ aulaId: aula.id, remarcacaoId: remarcacaoPendente.id, aceita: false });
                  aoConcluir('Proposta de remarcação recusada. O horário original foi mantido.');
                } catch (falha) {
                  setErroResposta(mensagemDeErro(falha, 'Não foi possível recusar a proposta. Tente novamente.'));
                }
              }}
              disabled={responder.isPending}
              className="botao-secundario h-11 px-5 text-sm disabled:opacity-60"
            >
              Recusar proposta
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ehPedido = aula.status === 'SOLICITADA';
  const textoBotaoCancelar = ehPedido ? 'Cancelar pedido' : 'Cancelar aula';

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      {modo === 'remarcar' && (
        <FormularioRemarcar
          aula={aula}
          papel={papel}
          onCancelar={() => setModo('nenhum')}
          aoConcluir={(msg) => {
            setModo('nenhum');
            aoConcluir(msg);
          }}
        />
      )}

      {modo === 'cancelar' && (
        <FormularioCancelar
          aula={aula}
          papel={papel}
          onVoltar={() => setModo('nenhum')}
          aoConcluir={(msg) => {
            setModo('nenhum');
            aoConcluir(msg);
          }}
        />
      )}

      {modo === 'nenhum' && (
        <div className="flex flex-wrap items-center gap-2.5">
          {podeRemarcar && (
            <button
              type="button"
              onClick={() => setModo('remarcar')}
              className="botao-secundario h-11 px-5 text-sm"
            >
              Remarcar aula
            </button>
          )}
          {podeCancelar && (
            <button
              type="button"
              onClick={() => setModo('cancelar')}
              className="botao-secundario h-11 px-5 text-sm"
            >
              {textoBotaoCancelar}
            </button>
          )}
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
  // Instante lido uma vez, ao montar o cartão (a renderização precisa ser pura).
  const [agora] = useState(() => Date.now());
  const idDetalhes = useId();
  const IconeModalidade = ICONE_MODALIDADE[aula.modalidade];
  const outro = papel === 'ALUNO' ? `com ${aula.professor.nome}` : `Aluno: ${aula.aluno.nome}`;
  const inicioMs = new Date(aula.inicio).getTime();
  const ehNasProximas24h =
    (aula.status === 'CONFIRMADA' || aula.status === 'REMARCADA') &&
    inicioMs > agora &&
    inicioMs - agora <= 24 * 60 * 60 * 1000;
  const aguardandoResposta = aula.status === 'SOLICITADA' && inicioMs > agora;
  const podeRemarcar = (aula.status === 'CONFIRMADA' || aula.status === 'REMARCADA') && inicioMs > agora;
  const podeCancelar =
    (aula.status === 'CONFIRMADA' || (papel === 'ALUNO' && aula.status === 'SOLICITADA')) && inicioMs > agora;

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
            <div className="flex flex-wrap items-center gap-1.5">
              {ehNasProximas24h && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-secondary">
                  <BellRing size={12} aria-hidden="true" />
                  Nas próximas 24 h
                </span>
              )}
              <SeloStatus status={aula.status} />
            </div>
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
            {aula.serieId && (
              <li className="inline-flex items-center gap-1.5">
                <Repeat size={14} aria-hidden="true" />
                Aula semanal
              </li>
            )}
          </ul>
          {aula.objetivo && <p className="mt-2 line-clamp-2 text-sm text-tinta">“{aula.objetivo}”</p>}
        </div>
      </div>

      {papel === 'PROFESSOR' && aguardandoResposta && <AcoesDoProfessor aula={aula} aoConcluir={aoConcluirAcao} />}
      {(podeRemarcar || podeCancelar) && (
        <AcoesDaAula
          aula={aula}
          papel={papel}
          podeRemarcar={podeRemarcar}
          podeCancelar={podeCancelar}
          aoConcluir={aoConcluirAcao}
        />
      )}

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
