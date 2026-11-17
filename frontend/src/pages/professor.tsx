import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { Cabecalho } from '../components/cabecalho';
import { CartaoProfessor } from '../components/cartao-professor';
import { AvatarProfessor, ListaModalidades } from '../components/professor-info';
import { formatarReais } from '../utils/formatacao';
import { ICONE_MODALIDADE } from '../utils/modalidades';
import { Rodape } from '../components/rodape';
import { SeletorHorarios } from '../components/seletor-horarios';
import { useProfessor, useProfessores } from '../hooks/use-professores';
import { useTitulo } from '../hooks/use-titulo';
import { ROTULO_MODALIDADE, type Modalidade, type ProfessorDetalhe } from '../services/professores';

const OUTROS_PROFESSORES = 3;

const DESCRICAO_MODALIDADE: Record<Modalidade, string> = {
  ONLINE: 'Aulas por videochamada. Os detalhes são combinados após a confirmação.',
  PRESENCIAL: 'Aulas no local de atendimento do professor. O endereço é informado após a confirmação.',
  DOMICILIO: 'Aulas presenciais no endereço do aluno, conforme a disponibilidade do professor.',
};

const PASSOS_DO_AGENDAMENTO = [
  { titulo: 'Escolha um horário', texto: 'Consulte a agenda e selecione um dos horários disponíveis.' },
  { titulo: 'Envie sua solicitação', texto: 'Informe o que deseja estudar e aguarde a resposta do professor.' },
  {
    titulo: 'Aguarde a confirmação',
    texto: 'Quando o professor aceitar, sua aula estará agendada. Você poderá acompanhar os detalhes pela plataforma.',
  },
];

/** "Física e Matemática", "Física, Inglês e Matemática". */
function juntarComE(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/** Agrupa as matérias pelo nome, com os níveis de cada uma. */
function materiasComNiveis(professor: ProfessorDetalhe): { nome: string; niveis: string[] }[] {
  const grupos = new Map<string, string[]>();
  for (const materia of professor.materias) {
    grupos.set(materia.nome, [...(grupos.get(materia.nome) ?? []), materia.nivel]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([nome, niveis]) => ({ nome, niveis }));
}

// ---------------------------------------------------------------------------
// Blocos do perfil
// ---------------------------------------------------------------------------

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-slate-200 py-8">
      <h2 id={id} className="text-xl font-bold text-tinta">
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Preço em destaque e duração ao lado: as duas informações que o aluno compara primeiro. */
function PrecoEDuracao({ professor }: { professor: ProfessorDetalhe }) {
  return (
    <dl className="mt-8 flex items-stretch rounded-xl border border-slate-200 bg-white">
      <div className="flex-1 px-5 py-4">
        <dt className="text-sm text-suave">Valor da aula</dt>
        <dd className="mt-1 flex items-baseline gap-1">
          {professor.valorHora !== null ? (
            <>
              <span className="text-3xl font-extrabold tracking-tight tabular-nums text-tinta">
                {formatarReais.format(professor.valorHora)}
              </span>
              <span className="text-suave">/hora</span>
            </>
          ) : (
            <span className="text-lg font-bold text-tinta">A consultar</span>
          )}
        </dd>
      </div>
      <div className="flex flex-col justify-center border-l border-slate-200 px-5 py-4">
        <dt className="text-sm text-suave">Duração</dt>
        <dd className="mt-1 flex items-center gap-1.5 text-lg font-bold text-tinta">
          <Clock size={18} className="text-secondary" aria-hidden="true" />1 hora
        </dd>
      </div>
    </dl>
  );
}

function CabecalhoDoPerfil({ professor }: { professor: ProfessorDetalhe }) {
  const nomesDasMaterias = materiasComNiveis(professor).map((materia) => materia.nome);

  return (
    <header className="pb-8">
      <div className="flex items-start gap-5">
        <AvatarProfessor id={professor.id} nome={professor.nome} tamanho="grande" />
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">{professor.nome}</h1>
          <p className="mt-1 text-suave">Aulas de {juntarComE(nomesDasMaterias)}</p>
          <div className="mt-2">
            <ListaModalidades modalidades={professor.modalidades} />
          </div>
        </div>
      </div>

      <PrecoEDuracao professor={professor} />
    </header>
  );
}

function MateriasENiveis({ professor }: { professor: ProfessorDetalhe }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {materiasComNiveis(professor).map((materia) => (
        <li key={materia.nome} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-tinta">{materia.nome}</span>
          <ul aria-label={`Níveis de ${materia.nome}`} className="flex flex-wrap gap-1.5">
            {materia.niveis.map((nivel) => (
              <li key={nivel} className="rounded-md bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
                {nivel}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Modalidades({ professor }: { professor: ProfessorDetalhe }) {
  return (
    <ul className="space-y-4">
      {professor.modalidades.map((modalidade) => {
        const Icone = ICONE_MODALIDADE[modalidade];
        return (
          <li key={modalidade} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-secondary">
              <Icone size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-tinta">{ROTULO_MODALIDADE[modalidade]}</p>
              <p className="text-sm text-suave">{DESCRICAO_MODALIDADE[modalidade]}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Agendamento() {
  return (
    <ol className="space-y-4">
      {PASSOS_DO_AGENDAMENTO.map((passo, indice) => (
        <li key={passo.titulo} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
            {indice + 1}
          </span>
          <div>
            <p className="font-semibold text-tinta">{passo.titulo}</p>
            <p className="text-sm text-suave">{passo.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Valores({ professor }: { professor: ProfessorDetalhe }) {
  return (
    <div className="space-y-2 text-suave">
      {professor.valorHora !== null ? (
        <>
          <p className="text-lg font-bold text-tinta">{formatarReais.format(professor.valorHora)} por hora</p>
          <p>Valor informado pelo professor para as modalidades disponíveis.</p>
        </>
      ) : (
        <p>O valor da aula é informado pelo professor após a solicitação.</p>
      )}
      <p className="text-sm">
        O pagamento é combinado diretamente com o professor. Não é necessário pagar para solicitar uma aula.
      </p>
    </div>
  );
}

/** Outros professores da primeira matéria, sem repetir o atual. Some se não houver nenhum. */
function OutrosProfessores({ professor }: { professor: ProfessorDetalhe }) {
  const materia = materiasComNiveis(professor)[0]?.nome;
  const { data } = useProfessores({ materia, limite: OUTROS_PROFESSORES + 1 });
  const outros = (data?.itens ?? []).filter((item) => item.id !== professor.id).slice(0, OUTROS_PROFESSORES);

  if (!materia || outros.length === 0) return null;

  return (
    <section aria-labelledby="titulo-outros" className="mt-16 border-t border-slate-200 pt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="titulo-outros" className="text-2xl font-extrabold tracking-tight text-tinta">
          Mais professores de {materia}
        </h2>
        <Link
          to={`/professores?materia=${encodeURIComponent(materia)}`}
          className="foco inline-flex items-center gap-1.5 rounded font-bold text-secondary hover:underline"
        >
          Ver todos
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {outros.map((item) => (
          <li key={item.id}>
            <CartaoProfessor professor={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** No celular, o card de horários fica abaixo do perfil: esta barra leva até ele. */
function BarraDeReservaMovel({ professor }: { professor: ProfessorDetalhe }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="conteudo flex items-center justify-between gap-4 py-3">
        <div className="text-sm text-suave">
          <p>
            {professor.valorHora !== null ? (
              <>
                <span className="text-lg font-bold tabular-nums text-tinta">
                  {formatarReais.format(professor.valorHora)}
                </span>
                /hora
              </>
            ) : (
              <span className="font-semibold text-tinta">Valor a consultar</span>
            )}
          </p>
          <p className="text-xs">Aula de 1 hora</p>
        </div>
        <a href="#horarios" className="botao-principal h-11">
          Ver horários
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function Esqueleto() {
  return (
    <div className="grid animate-pulse gap-10 lg:grid-cols-[1fr_24rem]" aria-hidden="true">
      <div>
        <div className="flex gap-5">
          <div className="h-16 w-16 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-7 w-1/2 rounded bg-slate-200" />
            <div className="h-4 w-1/3 rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-8 h-20 rounded-xl bg-slate-100" />
        <div className="mt-8 space-y-2">
          <div className="h-4 rounded bg-slate-100" />
          <div className="h-4 w-5/6 rounded bg-slate-100" />
        </div>
      </div>
      <div className="cartao h-96" />
    </div>
  );
}

function ehNaoEncontrado(erro: unknown): boolean {
  return erro instanceof AxiosError && (erro.response?.status === 404 || erro.response?.status === 400);
}

export function PaginaProfessor() {
  const { id = '' } = useParams();
  const { data: professor, isPending, isError, error, refetch } = useProfessor(id);
  useTitulo(professor?.nome ?? (isError && ehNaoEncontrado(error) ? 'Professor não encontrado' : 'Professor'));

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho />
      <main className={`conteudo flex-1 pt-6 sm:pt-10 ${professor ? 'pb-28 lg:pb-24' : 'pb-16 sm:pb-24'}`}>
        <nav aria-label="Você está em" className="mb-8 text-sm">
          <ol className="flex flex-wrap items-center gap-1.5 text-suave">
            <li>
              <Link to="/professores" className="foco rounded font-semibold hover:text-primary">
                Encontrar professores
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate text-tinta">
              {professor?.nome ?? '…'}
            </li>
          </ol>
        </nav>

        {isPending && <Esqueleto />}

        {isError &&
          (ehNaoEncontrado(error) ? (
            <div className="cartao p-10 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Professor não encontrado</h1>
              <p className="mt-2 text-suave">O perfil pode ter sido removido ou o endereço está incorreto.</p>
              <Link to="/professores" className="botao-secundario mt-6">
                Encontrar professores
              </Link>
            </div>
          ) : (
            <div className="cartao flex flex-col items-center gap-2 p-10 text-center">
              <p className="font-bold text-tinta">Não foi possível carregar o perfil.</p>
              <p className="text-sm text-suave">Ocorreu um problema ao buscar os dados. Tente novamente.</p>
              <button type="button" onClick={() => refetch()} className="botao-secundario mt-3">
                <RefreshCw size={16} aria-hidden="true" />
                Tentar novamente
              </button>
            </div>
          ))}

        {professor && (
          <>
            <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
              <div>
                <CabecalhoDoPerfil professor={professor} />
                <Secao id="titulo-sobre" titulo="Sobre o professor">
                  <p className="whitespace-pre-line text-suave">{professor.apresentacao}</p>
                </Secao>
                <Secao id="titulo-materias" titulo="Matérias e níveis">
                  <MateriasENiveis professor={professor} />
                </Secao>
                <Secao id="titulo-modalidades" titulo="Modalidades de atendimento">
                  <Modalidades professor={professor} />
                </Secao>
                <Secao id="titulo-agendamento" titulo="Como agendar uma aula">
                  <Agendamento />
                </Secao>
                <Secao id="titulo-valores" titulo="Valor da aula">
                  <Valores professor={professor} />
                </Secao>
              </div>

              <section
                id="horarios"
                aria-labelledby="titulo-horarios"
                className="cartao scroll-mt-24 p-5 sm:p-6 lg:sticky lg:top-24"
              >
                <h2 id="titulo-horarios" className="text-lg font-bold text-tinta">
                  Agende sua aula
                </h2>
                <p className="mt-1 text-sm text-suave">Escolha um dia e um horário para enviar sua solicitação.</p>
                <p className="mt-2 text-xs text-suave">Horários no fuso de Brasília · Aulas de 1 hora</p>
                <div className="mt-5">
                  <SeletorHorarios professor={professor} />
                </div>
              </section>
            </div>

            <OutrosProfessores professor={professor} />
            <BarraDeReservaMovel professor={professor} />
          </>
        )}
      </main>
      <Rodape />
    </div>
  );
}
