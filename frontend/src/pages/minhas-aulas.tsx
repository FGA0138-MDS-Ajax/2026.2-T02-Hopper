import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Abas, PainelDeAba } from '../components/abas';
import { AvisoSucesso } from '../components/aviso-sucesso';
import { Cabecalho } from '../components/cabecalho';
import { Paginacao } from '../components/paginacao';
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
      <Paginacao pagina={pagina} totalDePaginas={totalDePaginas} aoMudar={setPagina} />
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
            <div className="mt-6">
              <AvisoSucesso aoFechar={() => setMensagem(null)}>{mensagem}</AvisoSucesso>
            </div>
          )}

          <div className="mt-8">
            <Abas
              rotulo="Filtrar aulas"
              selecionada={idAba}
              aoEscolher={escolherAba}
              abas={abas.map((aba) => ({
                id: aba.id,
                rotulo: aba.rotulo,
                complemento:
                  aba.id === 'pendentes' && papel === 'PROFESSOR' ? <ContadorDePendentes agora={agora} /> : undefined,
              }))}
            />
          </div>

          <PainelDeAba id={abaAtual.id} className="pt-6">
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
          </PainelDeAba>
        </div>
      </main>
      <Rodape />
    </div>
  );
}
