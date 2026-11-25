import { useState } from 'react';
import { useResponderRemarcacao } from '../hooks/use-aulas';
import { mensagemDeErro } from '../services/api';
import { type Aula } from '../services/aulas';
import { dataHoraCurta, horaCurta } from '../utils/datas';
import { type Papel } from './cartao-aula';
import { FormularioCancelar } from './formulario-cancelar';
import { FormularioRemarcar } from './formulario-remarcar';

export function AcoesDaAula({
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

    async function responderProposta(aceita: boolean) {
      if (!remarcacaoPendente) return;
      setErroResposta(null);
      try {
        await responder.mutateAsync({ aulaId: aula.id, remarcacaoId: remarcacaoPendente.id, aceita });
        aoConcluir(
          aceita
            ? 'Proposta de remarcação aceita. O novo horário foi reservado.'
            : 'Proposta de remarcação recusada. O horário original foi mantido.',
        );
      } catch (falha) {
        setErroResposta(
          mensagemDeErro(
            falha,
            aceita
              ? 'Não foi possível aceitar a remarcação. Tente novamente.'
              : 'Não foi possível recusar a proposta. Tente novamente.',
          ),
        );
      }
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
              onClick={() => responderProposta(true)}
              disabled={responder.isPending}
              className="botao-principal h-11 px-5 text-sm disabled:opacity-60"
            >
              {responder.isPending ? 'Confirmando…' : 'Aceitar novo horário'}
            </button>
            <button
              type="button"
              onClick={() => responderProposta(false)}
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
            <button type="button" onClick={() => setModo('remarcar')} className="botao-secundario h-11 px-5 text-sm">
              Remarcar aula
            </button>
          )}
          {podeCancelar && (
            <button type="button" onClick={() => setModo('cancelar')} className="botao-secundario h-11 px-5 text-sm">
              {textoBotaoCancelar}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
