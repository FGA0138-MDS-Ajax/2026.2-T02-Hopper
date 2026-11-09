import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Atom,
  BookOpen,
  Calculator,
  CalendarCheck,
  CircleCheck,
  Dna,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  ListChecks,
  Monitor,
  Music,
  PenLine,
  RefreshCw,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { BarraBusca } from '../components/barra-busca';
import { Cabecalho } from '../components/cabecalho';
import { CartaoProfessor, CartaoProfessorEsqueleto } from '../components/cartao-professor';
import { Rodape } from '../components/rodape';
import { useMaterias, useProfessores } from '../hooks/use-professores';

// ---------------------------------------------------------------------------
// Matérias populares
// ---------------------------------------------------------------------------

const MATERIAS_PADRAO = ['Matemática', 'Português', 'Inglês', 'Física', 'Química', 'Redação', 'Biologia', 'História'];
const MAXIMO_CHIPS = 8;

const ICONES_MATERIA: [RegExp, LucideIcon][] = [
  [/matem/, Calculator],
  [/fisic/, Atom],
  [/quimic/, FlaskConical],
  [/biolog/, Dna],
  [/ingl|espanh|franc|idioma/, Languages],
  [/portug|redac|literat/, PenLine],
  [/histor/, Landmark],
  [/geograf/, Globe],
  [/music|violao|piano|canto/, Music],
  [/program|informat|comput/, Monitor],
];

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function iconeDaMateria(nome: string): LucideIcon {
  const chave = normalizar(nome);
  return ICONES_MATERIA.find(([padrao]) => padrao.test(chave))?.[1] ?? BookOpen;
}

function MateriasPopulares() {
  const { data } = useMaterias();
  // A API devolve uma linha por matéria e nível; aqui interessa só o nome.
  const nomesDaApi = [...new Set((data ?? []).map((materia) => materia.nome))];
  const nomes = (nomesDaApi.length > 0 ? nomesDaApi : MATERIAS_PADRAO).slice(0, MAXIMO_CHIPS);

  return (
    <div>
      <p className="text-sm font-semibold text-suave">Matérias populares</p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {nomes.map((nome) => {
          const Icone = iconeDaMateria(nome);
          return (
            <li key={nome}>
              <Link
                to={`/professores?materia=${encodeURIComponent(nome)}`}
                className="foco inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-tinta ring-1 ring-slate-200/80 transition-colors hover:text-secondary hover:ring-secondary"
              >
                <Icone size={17} className="text-secondary" aria-hidden="true" />
                {nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="conteudo flex flex-col items-center pb-16 pt-12 text-center sm:pb-20 sm:pt-20">
      <h1 className="max-w-4xl text-[2.35rem] font-extrabold leading-[1.06] tracking-tight text-tinta sm:text-6xl">
        Encontre um professor e agende sua <span className="text-secondary">próxima aula.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-suave">
        Busque professores por matéria, consulte os horários disponíveis e solicite sua aula diretamente pela
        plataforma. Simples para quem aprende, prático para quem ensina.
      </p>

      <div className="mt-10 w-full max-w-5xl text-left">
        <BarraBusca />
      </div>

      <div className="mt-8 w-full max-w-3xl">
        <MateriasPopulares />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Benefícios
// ---------------------------------------------------------------------------

const BENEFICIOS = [
  {
    icone: Search,
    titulo: 'Agendamento simples',
    texto: 'Encontre um professor e solicite sua aula em poucos passos.',
  },
  {
    icone: CalendarCheck,
    titulo: 'Horários atualizados',
    texto: 'Consulte a disponibilidade e escolha o melhor horário para você.',
  },
  {
    icone: ListChecks,
    titulo: 'Tudo organizado',
    texto: 'Acompanhe suas solicitações, aulas confirmadas e próximos compromissos.',
  },
];

function Beneficios() {
  return (
    <section aria-label="Benefícios" className="conteudo">
      <ul className="grid gap-8 border-y border-slate-200/80 py-10 sm:grid-cols-3 sm:gap-6">
        {BENEFICIOS.map((beneficio) => (
          <li key={beneficio.titulo} className="flex gap-4">
            <beneficio.icone size={24} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-tinta">{beneficio.titulo}</h2>
              <p className="mt-1 text-sm text-suave">{beneficio.texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Professores
// ---------------------------------------------------------------------------

const PROFESSORES_EM_DESTAQUE = 6;

function Professores() {
  const { data, isPending, isError, refetch } = useProfessores({ limite: PROFESSORES_EM_DESTAQUE });

  return (
    <section id="professores" className="conteudo scroll-mt-24 py-16 sm:py-24">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-tinta sm:text-4xl">
            Encontre o professor ideal para você
          </h2>
          <p className="mt-3 text-suave">
            Explore os professores disponíveis e escolha de acordo com a matéria, a modalidade e os horários de
            atendimento.
          </p>
        </div>
        <Link to="/professores" className="botao-secundario shrink-0 self-start sm:self-auto">
          Ver todos os professores
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-10" aria-live="polite" aria-busy={isPending}>
        {isPending && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, indice) => (
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
          <div className="cartao p-10 text-center">
            <p className="font-bold text-tinta">Ainda não há professores disponíveis.</p>
            <p className="mt-1 text-sm text-suave">
              Dá aulas?{' '}
              <Link to="/cadastro?perfil=PROFESSOR" className="foco rounded font-bold text-secondary underline">
                Cadastre-se e publique seus horários.
              </Link>
            </p>
          </div>
        )}

        {data && data.itens.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.itens.map((professor) => (
              <li key={professor.id}>
                <CartaoProfessor professor={professor} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Como funciona
// ---------------------------------------------------------------------------

const ETAPAS = [
  {
    titulo: 'Encontre um professor',
    texto: 'Pesquise pela matéria que deseja estudar e conheça os professores disponíveis.',
  },
  {
    titulo: 'Escolha um horário',
    texto: 'Consulte a agenda do professor e selecione um horário que funcione para você.',
  },
  {
    titulo: 'Solicite sua aula',
    texto: 'Informe o que deseja estudar e envie a solicitação. O professor poderá aceitar ou recusar o pedido.',
  },
  {
    titulo: 'Acompanhe suas aulas',
    texto: 'Receba a confirmação, consulte seus próximos horários e gerencie suas aulas pela plataforma.',
  },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-white py-16 sm:py-24">
      <div className="conteudo">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-tinta sm:text-4xl">Marcar uma aula é simples</h2>
          <p className="mt-3 text-suave">
            Encontre um professor, escolha um horário e acompanhe sua solicitação em um só lugar.
          </p>
        </div>

        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {ETAPAS.map((etapa, indice) => (
            <li key={etapa.titulo} className="border-t-2 border-secondary pt-5">
              <p className="text-sm font-bold tabular-nums text-secondary">{String(indice + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 text-lg font-bold text-tinta">{etapa.titulo}</h3>
              <p className="mt-2 text-sm text-suave">{etapa.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Para professores
// ---------------------------------------------------------------------------

const VANTAGENS_PROFESSOR = [
  { titulo: 'Organize sua disponibilidade', texto: 'defina os dias e horários em que você pode dar aulas.' },
  {
    titulo: 'Receba solicitações completas',
    texto: 'saiba a matéria, o nível e o objetivo do aluno antes de confirmar.',
  },
  {
    titulo: 'Gerencie suas aulas',
    texto: 'acompanhe agendamentos, remarcações e cancelamentos sem perder o histórico.',
  },
];

function ParaProfessores() {
  return (
    <section id="para-professores" className="conteudo scroll-mt-24 py-16 sm:py-24">
      <div className="grid gap-10 rounded-[1.75rem] bg-gradient-to-br from-secondary to-primary px-6 py-12 text-white sm:px-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.6rem]">
            Mais tempo para ensinar. Menos trabalho para organizar.
          </h2>
          <p className="mt-4 max-w-lg text-blue-100">
            Mantenha seus horários atualizados, receba solicitações de alunos e organize suas aulas em um único
            lugar.
          </p>
          <Link
            to="/cadastro?perfil=PROFESSOR"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-primary transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            Quero dar aulas
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <ul className="space-y-5">
          {VANTAGENS_PROFESSOR.map((vantagem) => (
            <li key={vantagem.titulo} className="flex gap-3">
              <CircleCheck size={20} className="mt-0.5 shrink-0 text-menta" aria-hidden="true" />
              <p className="text-blue-100">
                <span className="font-bold text-white">{vantagem.titulo}:</span> {vantagem.texto}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export function PaginaInicio() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-primary focus:shadow-cartao"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo" className="flex-1">
        <Hero />
        <Beneficios />
        <Professores />
        <ComoFunciona />
        <ParaProfessores />
      </main>
      <Rodape />
    </div>
  );
}
