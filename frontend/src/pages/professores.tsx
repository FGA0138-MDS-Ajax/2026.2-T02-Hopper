import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw, SearchX, X } from 'lucide-react';
import { BarraBusca } from '../components/barra-busca';
import { Cabecalho } from '../components/cabecalho';
import { CartaoProfessor, CartaoProfessorEsqueleto } from '../components/cartao-professor';
import { Rodape } from '../components/rodape';
import { useProfessores } from '../hooks/use-professores';
import { useTitulo } from '../hooks/use-titulo';
import { ROTULO_MODALIDADE, type FiltrosBusca, type Modalidade } from '../services/professores';

export const PROFESSORES_POR_PAGINA = 9;

type ChaveFiltro = 'materia' | 'nivel' | 'modalidade';

const ROTULO_FILTRO: Record<ChaveFiltro, string> = {
  materia: 'Matéria',
  nivel: 'Nível',
  modalidade: 'Modalidade',
};

function ehModalidade(valor: string | null): valor is Modalidade {
  return valor !== null && valor in ROTULO_MODALIDADE;
}

function textoOuIndefinido(valor: string | null): string | undefined {
  const limpo = valor?.trim();
  return limpo ? limpo : undefined;
}

/** Lê os filtros da URL, ignorando valores inválidos (ex.: modalidade inexistente). */
function lerFiltros(parametros: URLSearchParams): Required<Pick<FiltrosBusca, 'pagina' | 'limite'>> & FiltrosBusca {
  const modalidade = parametros.get('modalidade');
  const pagina = Number.parseInt(parametros.get('pagina') ?? '', 10);
  return {
    materia: textoOuIndefinido(parametros.get('materia')),
    nivel: textoOuIndefinido(parametros.get('nivel')),
    modalidade: ehModalidade(modalidade) ? modalidade : undefined,
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
    limite: PROFESSORES_POR_PAGINA,
  };
}

function textoDoResultado(total: number): string {
  if (total === 0) return 'Nenhum professor encontrado';
  return total === 1 ? '1 professor encontrado' : `${total} professores encontrados`;
}

export function PaginaProfessores() {
  useTitulo('Encontrar professores');
  const [parametros, setParametros] = useSearchParams();
  const filtros = lerFiltros(parametros);
  const { data, isPending, isError, isPlaceholderData, refetch } = useProfessores(filtros);

  const filtrosAtivos = (Object.keys(ROTULO_FILTRO) as ChaveFiltro[]).flatMap((chave) => {
    const valor = filtros[chave];
    if (!valor) return [];
    const texto = chave === 'modalidade' ? ROTULO_MODALIDADE[valor as Modalidade] : valor;
    return [{ chave, texto }];
  });

  const totalDePaginas = data ? Math.max(1, Math.ceil(data.total / PROFESSORES_POR_PAGINA)) : 1;

  function removerFiltro(chave: ChaveFiltro) {
    const proximos = new URLSearchParams(parametros);
    proximos.delete(chave);
    proximos.delete('pagina');
    setParametros(proximos);
  }

  function limparFiltros() {
    setParametros(new URLSearchParams());
  }

  function irParaPagina(pagina: number) {
    const proximos = new URLSearchParams(parametros);
    if (pagina <= 1) proximos.delete('pagina');
    else proximos.set('pagina', String(pagina));
    setParametros(proximos);
    window.scrollTo({ top: 0 });
  }

  // A barra é recriada quando os filtros da URL mudam, para refletir o que está aplicado.
  const chaveDaBarra = filtrosAtivos.map((filtro) => `${filtro.chave}=${filtro.texto}`).join('&');

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho />
      <main className="flex-1">
        <section className="conteudo pb-8 pt-10 sm:pt-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-5xl">Encontrar professores</h1>
          <p className="mt-3 max-w-2xl text-suave">
            Filtre por matéria, nível e modalidade e veja quem tem horários disponíveis.
          </p>
          <div className="mt-8">
            <BarraBusca
              key={chaveDaBarra}
              inicial={{ materia: filtros.materia, nivel: filtros.nivel, modalidade: filtros.modalidade }}
            />
          </div>
        </section>

        <section aria-labelledby="titulo-resultados" className="conteudo pb-16 sm:pb-24">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="titulo-resultados" className="font-bold text-tinta" aria-live="polite">
              {data ? textoDoResultado(data.total) : 'Buscando professores…'}
            </h2>

            {filtrosAtivos.length > 0 && (
              <ul aria-label="Filtros aplicados" className="flex flex-wrap items-center gap-2">
                {filtrosAtivos.map((filtro) => (
                  <li key={filtro.chave}>
                    <button
                      type="button"
                      onClick={() => removerFiltro(filtro.chave)}
                      className="foco inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary/10 pl-3 pr-2 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/20"
                      aria-label={`Remover filtro ${ROTULO_FILTRO[filtro.chave]}: ${filtro.texto}`}
                    >
                      <span className="font-medium text-suave">{ROTULO_FILTRO[filtro.chave]}:</span>
                      {filtro.texto}
                      <X size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="foco h-9 rounded-lg px-3 text-sm font-bold text-primary underline-offset-4 hover:underline"
                  >
                    Limpar filtros
                  </button>
                </li>
              </ul>
            )}
          </div>

          <div className="mt-8" aria-busy={isPending || isPlaceholderData}>
            {isPending && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, indice) => (
                  <CartaoProfessorEsqueleto key={indice} />
                ))}
              </div>
            )}

            {isError && (
              <div className="cartao flex flex-col items-center gap-2 p-10 text-center">
                <p className="font-bold text-tinta">Não foi possível carregar os professores.</p>
                <p className="text-sm text-suave">Ocorreu um problema ao buscar os resultados. Tente novamente.</p>
                <button type="button" onClick={() => refetch()} className="botao-secundario mt-3">
                  <RefreshCw size={16} aria-hidden="true" />
                  Tentar novamente
                </button>
              </div>
            )}

            {data && data.itens.length === 0 && (
              <div className="cartao flex flex-col items-center gap-2 p-10 text-center">
                <SearchX size={28} className="text-suave" aria-hidden="true" />
                {data.total > 0 ? (
                  <>
                    <p className="mt-2 font-bold text-tinta">Esta página não tem resultados.</p>
                    <button type="button" onClick={() => irParaPagina(1)} className="botao-secundario mt-3">
                      Voltar para a primeira página
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-2 font-bold text-tinta">Nenhum professor encontrado para esses filtros.</p>
                    <p className="text-sm text-suave">Tente outra matéria ou remova algum filtro.</p>
                    {filtrosAtivos.length > 0 && (
                      <button type="button" onClick={limparFiltros} className="botao-secundario mt-3">
                        Limpar filtros
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {data && data.itens.length > 0 && (
              <ul
                className={`grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
                  isPlaceholderData ? 'opacity-60' : ''
                }`}
              >
                {data.itens.map((professor) => (
                  <li key={professor.id}>
                    <CartaoProfessor professor={professor} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data && totalDePaginas > 1 && (
            <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => irParaPagina(filtros.pagina - 1)}
                disabled={filtros.pagina <= 1}
                className="botao-secundario h-11 px-4 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} aria-hidden="true" />
                Anterior
              </button>
              <p className="min-w-28 text-center text-sm font-semibold tabular-nums text-suave">
                Página {Math.min(filtros.pagina, totalDePaginas)} de {totalDePaginas}
              </p>
              <button
                type="button"
                onClick={() => irParaPagina(filtros.pagina + 1)}
                disabled={filtros.pagina >= totalDePaginas}
                className="botao-secundario h-11 px-4 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </nav>
          )}
        </section>
      </main>
      <Rodape />
    </div>
  );
}
