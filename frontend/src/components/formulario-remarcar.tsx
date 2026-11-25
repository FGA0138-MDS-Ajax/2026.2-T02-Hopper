import { useId, useState } from 'react';
import { useProporRemarcacao } from '../hooks/use-aulas';
import { mensagemDeErro } from '../services/api';
import { type Aula } from '../services/aulas';
import { chaveDoDia, hora, instanteEmBrasilia } from '../utils/datas';
import { type Papel } from './cartao-aula';

export function FormularioRemarcar({
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
