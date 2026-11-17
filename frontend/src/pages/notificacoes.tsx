import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BellRing,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  CheckCheck,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Abas, PainelDeAba } from '../components/abas';
import { AlertaErro } from '../components/layout-autenticacao';
import { Cabecalho } from '../components/cabecalho';
import { Paginacao } from '../components/paginacao';
import { Rodape } from '../components/rodape';
import { useSessao } from '../contexts/sessao';
import { useMarcarComoLidas, useNotificacoes } from '../hooks/use-notificacoes';
import { useTitulo } from '../hooks/use-titulo';
import { mensagemDeErro } from '../services/api';
import type { Notificacao, TipoNotificacao } from '../services/notificacoes';
import { dataHoraCurta } from '../utils/datas';

const AVISOS_POR_PAGINA = 10;

type IdAba = 'todas' | 'nao-lidas';

function ehAba(valor: string | null): valor is IdAba {
  return valor === 'todas' || valor === 'nao-lidas';
}

const VISUAL_DO_TIPO: Record<TipoNotificacao, { icone: LucideIcon; classe: string }> = {
  SOLICITACAO: { icone: CalendarPlus, classe: 'bg-ambar/15 text-amber-800' },
  CONFIRMACAO: { icone: CalendarCheck, classe: 'bg-menta/15 text-emerald-800' },
  RECUSA: { icone: XCircle, classe: 'bg-error/10 text-error' },
  REMARCACAO: { icone: CalendarClock, classe: 'bg-ceu/15 text-sky-800' },
  CANCELAMENTO: { icone: CalendarX, classe: 'bg-error/10 text-error' },
  LEMBRETE: { icone: BellRing, classe: 'bg-blue-50 text-secondary' },
};

/** Aba de "Minhas aulas" onde a aula do aviso aparece. */
const ABA_DA_AULA: Record<TipoNotificacao, string> = {
  SOLICITACAO: 'pendentes',
  CONFIRMACAO: 'proximas',
  LEMBRETE: 'proximas',
  RECUSA: 'historico',
  REMARCACAO: 'historico',
  CANCELAMENTO: 'historico',
};

function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho />
      <main className="conteudo flex-1 pb-16 pt-10 sm:pb-24 sm:pt-14">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
      <Rodape />
    </div>
  );
}

function ItemDeNotificacao({
  notificacao,
  aoMarcar,
  ocupado,
}: {
  notificacao: Notificacao;
  aoMarcar: (id: string) => void;
  ocupado: boolean;
}) {
  const { icone: Icone, classe } = VISUAL_DO_TIPO[notificacao.tipo];
  const naoLida = !notificacao.lida;

  return (
    <article
      className={`flex gap-4 rounded-2xl border p-4 sm:p-5 ${
        naoLida ? 'border-secondary/30 bg-white shadow-sm' : 'border-slate-200 bg-surface'
      }`}
    >
      <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${classe}`}>
        <Icone size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${naoLida ? 'font-semibold text-tinta' : 'text-suave'}`}>
          {naoLida && <span className="sr-only">Não lida: </span>}
          {notificacao.mensagem}
        </p>
        <p className="mt-1 text-xs text-suave">{dataHoraCurta(notificacao.criadoEm)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {notificacao.aulaId && (
            <Link
              to={`/minhas-aulas?aba=${ABA_DA_AULA[notificacao.tipo]}`}
              onClick={() => naoLida && aoMarcar(notificacao.id)}
              className="foco rounded text-sm font-bold text-secondary hover:underline"
            >
              Ver aula
            </Link>
          )}
          {naoLida && (
            <button
              type="button"
              onClick={() => aoMarcar(notificacao.id)}
              disabled={ocupado}
              className="foco rounded text-sm font-semibold text-suave hover:text-primary disabled:opacity-60"
            >
              Marcar como lida
            </button>
          )}
        </div>
      </div>
      {naoLida && <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />}
    </article>
  );
}

function ListaDeNotificacoes({ apenasNaoLidas }: { apenasNaoLidas: boolean }) {
  const [pagina, setPagina] = useState(1);
  const { data, isPending, isError, isPlaceholderData, refetch } = useNotificacoes({
    apenasNaoLidas,
    pagina,
    limite: AVISOS_POR_PAGINA,
  });
  const marcar = useMarcarComoLidas();
  const [erro, setErro] = useState<string | null>(null);

  async function marcarComoLida(id: string) {
    setErro(null);
    try {
      await marcar.mutateAsync([id]);
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível marcar o aviso como lido.'));
    }
  }

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, indice) => (
          <div key={indice} className="h-24 animate-pulse rounded-2xl bg-slate-100" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="cartao flex flex-col items-center gap-2 p-10 text-center">
        <p className="font-bold text-tinta">Não foi possível carregar os avisos.</p>
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
        <p className="text-suave">
          {apenasNaoLidas
            ? 'Tudo em dia: nenhum aviso para ler.'
            : 'Nenhum aviso ainda. Quando uma aula for pedida, confirmada ou recusada, você fica sabendo por aqui.'}
        </p>
      </div>
    );
  }

  const totalDePaginas = Math.max(1, Math.ceil(data.total / AVISOS_POR_PAGINA));

  return (
    <>
      {erro && (
        <div className="mb-4">
          <AlertaErro>{erro}</AlertaErro>
        </div>
      )}
      <ul className={`space-y-3 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
        {data.itens.map((notificacao) => (
          <li key={notificacao.id}>
            <ItemDeNotificacao notificacao={notificacao} aoMarcar={marcarComoLida} ocupado={marcar.isPending} />
          </li>
        ))}
      </ul>
      <Paginacao pagina={pagina} totalDePaginas={totalDePaginas} aoMudar={setPagina} />
    </>
  );
}

/** Botão "Marcar todas como lidas", só quando há algo para marcar. */
function MarcarTodas() {
  const { data } = useNotificacoes({ apenasNaoLidas: true, limite: 1 });
  const marcar = useMarcarComoLidas();
  const [erro, setErro] = useState<string | null>(null);
  if (!data || data.naoLidas === 0) return null;

  async function marcarTodas() {
    setErro(null);
    try {
      await marcar.mutateAsync(undefined);
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível marcar os avisos como lidos.'));
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={marcarTodas}
        disabled={marcar.isPending}
        className="botao-secundario h-10 px-4 text-sm disabled:opacity-60"
      >
        <CheckCheck size={16} aria-hidden="true" />
        {marcar.isPending ? 'Marcando…' : 'Marcar todas como lidas'}
      </button>
      {erro && (
        <p role="alert" className="text-sm font-medium text-error">
          {erro}
        </p>
      )}
    </div>
  );
}

function ContadorNaoLidas() {
  const { data } = useNotificacoes({ apenasNaoLidas: true, limite: 1 });
  if (!data || data.naoLidas === 0) return null;
  return (
    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-white">
      {data.naoLidas}
      <span className="sr-only"> não lidas</span>
    </span>
  );
}

/** RF13: avisos de pedidos, confirmações e recusas, dentro da aplicação. */
export function PaginaNotificacoes() {
  useTitulo('Notificações');
  const { usuario } = useSessao();
  const [parametros, setParametros] = useSearchParams();

  if (!usuario) return null; // A rota é protegida; isto só acontece durante o redirecionamento.

  if (usuario.perfil === 'ADMIN') {
    return (
      <Moldura>
        <div className="cartao p-10 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Notificações</h1>
          <p className="mt-2 text-suave">Contas de administrador não recebem avisos de aulas.</p>
        </div>
      </Moldura>
    );
  }

  const idAba: IdAba = ehAba(parametros.get('aba')) ? (parametros.get('aba') as IdAba) : 'todas';

  function escolherAba(id: IdAba) {
    setParametros(id === 'todas' ? {} : { aba: id }, { replace: true });
  }

  return (
    <Moldura>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">Notificações</h1>
          <p className="mt-2 text-suave">Pedidos, confirmações e recusas das suas aulas.</p>
        </div>
        <MarcarTodas />
      </div>

      <div className="mt-8">
        <Abas
          rotulo="Filtrar avisos"
          selecionada={idAba}
          aoEscolher={escolherAba}
          abas={[
            { id: 'todas', rotulo: 'Todas' },
            { id: 'nao-lidas', rotulo: 'Não lidas', complemento: <ContadorNaoLidas /> },
          ]}
        />
      </div>
      <PainelDeAba id={idAba} className="pt-6">
        <ListaDeNotificacoes key={idAba} apenasNaoLidas={idAba === 'nao-lidas'} />
      </PainelDeAba>
    </Moldura>
  );
}
