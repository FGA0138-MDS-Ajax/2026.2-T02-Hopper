import { useId, useState } from 'react';
import { useCancelarAula } from '../hooks/use-aulas';
import { mensagemDeErro } from '../services/api';
import { type Aula } from '../services/aulas';
import { type Papel } from './cartao-aula';

const TAMANHO_MAXIMO_MOTIVO = 300;

export function FormularioCancelar({
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
