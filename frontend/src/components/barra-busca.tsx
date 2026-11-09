import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { useMaterias } from '../hooks/use-professores';
import { ROTULO_MODALIDADE, type Modalidade } from '../services/professores';

const MODALIDADES = Object.entries(ROTULO_MODALIDADE) as [Modalidade, string][];

/** Usado enquanto a lista de matérias não chega da API (ou se ela falhar). */
export const NIVEIS_PADRAO = ['Ensino Fundamental', 'Ensino Médio', 'Pré-vestibular / ENEM', 'Ensino Superior'];

/** Os níveis vêm das matérias cadastradas, para o filtro bater com o banco. */
function useNiveis(): string[] {
  const { data } = useMaterias();
  const niveis = [...new Set((data ?? []).map((materia) => materia.nivel))];
  if (niveis.length === 0) return NIVEIS_PADRAO;
  return niveis.sort((a, b) => {
    const posicaoA = NIVEIS_PADRAO.indexOf(a);
    const posicaoB = NIVEIS_PADRAO.indexOf(b);
    if (posicaoA === -1 && posicaoB === -1) return a.localeCompare(b, 'pt-BR');
    if (posicaoA === -1) return 1;
    if (posicaoB === -1) return -1;
    return posicaoA - posicaoB;
  });
}

/** Busca por matéria, nível e modalidade (RF07); leva para /professores com os filtros na URL. */
export function BarraBusca() {
  const navegar = useNavigate();
  const niveis = useNiveis();
  const [materia, setMateria] = useState('');
  const [nivel, setNivel] = useState('');
  const [modalidade, setModalidade] = useState<Modalidade | ''>('');

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const parametros = new URLSearchParams();
    if (materia.trim()) parametros.set('materia', materia.trim());
    if (nivel) parametros.set('nivel', nivel);
    if (modalidade) parametros.set('modalidade', modalidade);
    const consulta = parametros.toString();
    navegar(consulta ? `/professores?${consulta}` : '/professores');
  }

  const classeSeletor = 'w-full cursor-pointer bg-transparent text-base font-medium text-tinta focus:outline-none';
  const divisor = <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-slate-200 lg:block" />;

  return (
    <form
      role="search"
      aria-label="Buscar professores"
      onSubmit={enviar}
      className="flex w-full flex-col gap-1 rounded-[1.75rem] bg-white p-2 shadow-cartao ring-1 ring-slate-200/70 lg:flex-row lg:items-center lg:rounded-full"
    >
      <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full px-4 focus-within:bg-surface">
        <BookOpen size={20} className="shrink-0 text-secondary" aria-hidden="true" />
        <span className="sr-only">Matéria</span>
        <input
          type="text"
          value={materia}
          onChange={(evento) => setMateria(evento.target.value)}
          placeholder="O que você quer aprender?"
          maxLength={100}
          className="w-full min-w-0 bg-transparent text-base font-medium text-tinta placeholder:text-slate-500 focus:outline-none"
        />
      </label>

      {divisor}

      <label className="flex h-12 shrink-0 items-center rounded-full px-4 focus-within:bg-surface lg:w-44">
        <span className="sr-only">Nível</span>
        <select value={nivel} onChange={(evento) => setNivel(evento.target.value)} className={classeSeletor}>
          <option value="">Todos os níveis</option>
          {niveis.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </label>

      {divisor}

      <label className="flex h-12 shrink-0 items-center rounded-full px-4 focus-within:bg-surface lg:w-[14.75rem]">
        <span className="sr-only">Modalidade</span>
        <select
          value={modalidade}
          onChange={(evento) => setModalidade(evento.target.value as Modalidade | '')}
          className={classeSeletor}
        >
          <option value="">Todas as modalidades</option>
          {MODALIDADES.map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="botao-principal mt-1 shrink-0 lg:mt-0 lg:px-7">
        <Search size={18} aria-hidden="true" />
        Buscar professores
      </button>
    </form>
  );
}
