import { useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CircleCheck, RefreshCw, X } from 'lucide-react';
import { Cabecalho } from '../components/cabecalho';
import { CartaoAula, type Papel } from '../components/cartao-aula';
import { Rodape } from '../components/rodape';
import { useSessao } from '../contexts/sessao';
import { useAulas } from '../hooks/use-aulas';
import { useTitulo } from '../hooks/use-titulo';
import type { FiltrosAulas } from '../services/aulas';

const AULAS_POR_PAGINA = 10;

type IdAba = 'proximas' | 'pendentes' | 'historico';

interface Aba {
  id: IdAba;
  rotulo: string;
  vazio: string;
  /** Monta os filtros da API; "agora" separa o que ainda vai acontecer. */
  filtros: (agora: string) => FiltrosAulas;
  /** A API lista da mais recente para a mais antiga; as próximas aulas ficam melhores na ordem do calendário. */
  ordemDoCalendario?: boolean;
}

function abasDoPapel(papel: Papel): Aba[] {
  return [
    {
      id: 'proximas',
      rotulo: 'Próximas',
      vazio:
        papel === 'ALUNO'
          ? 'Nenhuma aula confirmada por enquanto. Quando o professor aceitar um pedido, a aula aparece aqui.'
          : 'Nenhuma aula confirmada por enquanto. As aulas que você aceitar aparecem aqui.',
      filtros: (agora) => ({ status: 'CONFIRMADA', de: agora }),
      ordemDoCalendario: true,
    },
    {
      id: 'pendentes',
      rotulo: papel === 'ALUNO' ? 'Aguardando resposta' : 'Pedidos para responder',
      vazio:
        papel === 'ALUNO'
          ? 'Nenhum pedido aguardando resposta.'
          : 'Nenhum pedido novo. Quando um aluno solicitar uma aula, ela aparece aqui.',
      filtros: (agora) => ({ status: 'SOLICITADA', de: agora }),
      ordemDoCalendario: true,
    },
    {
      id: 'historico',
      rotulo: 'Histórico',
      vazio: 'Você ainda não tem aulas.',
      filtros: () => ({}),
    },
  ];
}

function ehAba(valor: string | null): valor is IdAba {
  return valor === 'proximas' || valor === 'pendentes' || valor === 'historico';
}

/** Selo com a quantidade de pedidos para responder (só aparece se houver). */
function ContadorDePendentes({ agora }: { agora: string }) {
  const { data } = useAulas({ status: 'SOLICITADA', de: agora, limite: 1 });
  if (!data || data.total === 0) return null;
  return (
    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-white">
      {data.total}
      <span className="sr-only"> pendentes</span>
    </span>
  );
}

function ListaDaAba({
  aba,
  agora,
  papel,
  aoConcluirAcao,
}: {
  aba: Aba;
  agora: string;
  papel: Papel;
  aoConcluirAcao: (mensagem: string) => void;
}) {
  const [pagina, setPagina] = useState(1);
  const { data, isPending, isError, isPlaceholderData, refetch } = useAulas({
    ...aba.filtros(agora),
    pagina,
    limite: AULAS_POR_PAGINA,
  });

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, indice) => (
          <div key={indice} className="cartao h-28 animate-pulse bg-white" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="cartao flex flex-col items-center gap-2 p-10 text-center">
        <p className="font-bold text-tinta">Não foi possível carregar suas aulas.</p>
        <button type="button" onClick={() => refetch()} className="botao-secundario mt-3">
          <RefreshCw size={16} aria-hidden="true" />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (data.itens.length === 0) {
    return (
      <div className="cartao p-10 text-center">
        <p className="text-suave">{aba.vazio}</p>
        {papel === 'ALUNO' && aba.id !== 'historico' && (
          <Link to="/professores" className="botao-principal mt-6">
            Encontrar professores
          </Link>
        )}
      </div>
    );
  }

  const aulas = aba.ordemDoCalendario
    ? [...data.itens].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
    : data.itens;
  const totalDePaginas = Math.max(1, Math.ceil(data.total / AULAS_POR_PAGINA));

  return (
    <>
      <ul className={`space-y-3 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
        {aulas.map((aula) => (
          <li key={aula.id}>
            <CartaoAula aula={aula} papel={papel} aoConcluirAcao={aoConcluirAcao} />
          </li>
        ))}
      </ul>
      {totalDePaginas > 1 && (
        <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPagina((atual) => atual - 1)}
            disabled={pagina <= 1}
            className="botao-secundario h-11 px-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Anterior
          </button>
          <p className="text-sm font-semibold tabular-nums text-suave">
            Página {pagina} de {totalDePaginas}
          </p>
          <button
            type="button"
            onClick={() => setPagina((atual) => atual + 1)}
            disabled={pagina >= totalDePaginas}
            className="botao-secundario h-11 px-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </nav>
      )}
    </>
  );
}

export function PaginaMinhasAulas() {
  useTitulo('Minhas aulas');
  const { usuario } = useSessao();
  const [parametros, setParametros] = useSearchParams();
  // Instante fixo durante a visita: mantém estável a chave das consultas.
  const [agora] = useState(() => new Date().toISOString());
  const [mensagem, setMensagem] = useState<string | null>(null);

  if (!usuario) return null; // A rota é protegida; isto só acontece durante o redirecionamento.

  if (usuario.perfil === 'ADMIN') {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecalho />
        <main className="conteudo flex-1 py-16">
          <div className="cartao mx-auto max-w-xl p-10 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Minhas aulas</h1>
            <p className="mt-2 text-suave">Contas de administrador não participam de aulas.</p>
          </div>
        </main>
        <Rodape />
      </div>
    );
  }

  const papel: Papel = usuario.perfil;
  const abas = abasDoPapel(papel);
  const abaPadrao: IdAba = papel === 'PROFESSOR' ? 'pendentes' : 'proximas';
  const idAba = ehAba(parametros.get('aba')) ? (parametros.get('aba') as IdAba) : abaPadrao;
  const abaAtual = abas.find((aba) => aba.id === idAba) ?? abas[0];

  function escolherAba(id: IdAba) {
    setMensagem(null);
    setParametros(id === abaPadrao ? {} : { aba: id }, { replace: true });
  }

  /** Setas do teclado movem entre as abas (padrão de abas acessíveis). */
  function navegarComTeclado(evento: KeyboardEvent<HTMLDivElement>) {
    const indice = abas.findIndex((aba) => aba.id === idAba);
    const passo = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (!passo) return;
    evento.preventDefault();
    const proxima = abas[(indice + passo + abas.length) % abas.length];
    escolherAba(proxima.id);
    document.getElementById(`aba-${proxima.id}`)?.focus();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho />
      <main className="conteudo flex-1 pb-16 pt-10 sm:pb-24 sm:pt-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">Minhas aulas</h1>
          <p className="mt-2 text-suave">
            {papel === 'ALUNO'
              ? 'Acompanhe seus pedidos e as próximas aulas.'
              : 'Responda os pedidos dos alunos e acompanhe sua agenda.'}
          </p>

          {mensagem && (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 rounded-xl border border-menta/30 bg-menta/10 px-4 py-3 text-sm text-emerald-900"
            >
              <CircleCheck size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
              <p className="flex-1">{mensagem}</p>
              <button
                type="button"
                onClick={() => setMensagem(null)}
                className="foco rounded text-emerald-800"
                aria-label="Fechar aviso"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          <div
            role="tablist"
            aria-label="Filtrar aulas"
            onKeyDown={navegarComTeclado}
            className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-200"
          >
            {abas.map((aba) => {
              const selecionada = aba.id === idAba;
              return (
                <button
                  key={aba.id}
                  id={`aba-${aba.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selecionada}
                  aria-controls={`painel-${aba.id}`}
                  tabIndex={selecionada ? 0 : -1}
                  onClick={() => escolherAba(aba.id)}
                  className={`foco -mb-px inline-flex shrink-0 items-center whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                    selecionada
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-suave hover:text-primary'
                  }`}
                >
                  {aba.rotulo}
                  {aba.id === 'pendentes' && papel === 'PROFESSOR' && <ContadorDePendentes agora={agora} />}
                </button>
              );
            })}
          </div>

          <div id={`painel-${abaAtual.id}`} role="tabpanel" aria-labelledby={`aba-${abaAtual.id}`} className="pt-6">
            <ListaDaAba
              key={abaAtual.id}
              aba={abaAtual}
              agora={agora}
              papel={papel}
              aoConcluirAcao={(texto) => {
                setMensagem(texto);
                window.scrollTo({ top: 0 });
              }}
            />
          </div>
        </div>
      </main>
      <Rodape />
    </div>
  );
}
