import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CircleCheck, Clock, RefreshCw, Repeat } from 'lucide-react';
import { Cabecalho } from '../components/cabecalho';
import { AlertaErro, BotaoEnviar } from '../components/layout-autenticacao';
import { AvatarProfessor } from '../components/professor-info';
import { Rodape } from '../components/rodape';
import { useSessao } from '../contexts/sessao';
import { useProfessor } from '../hooks/use-professores';
import { useTitulo } from '../hooks/use-titulo';
import { mensagemDeErro } from '../services/api';
import { codigoDeErro } from '../services/auth';
import { solicitarAula, type Aula, type DadosSolicitacao as DadosParaApi } from '../services/aulas';
import { ROTULO_MODALIDADE, type Modalidade, type ProfessorDetalhe } from '../services/professores';
import { chaveDoDia, diaDaUltimaAula, diaPorExtenso, horaCurta } from '../utils/datas';
import { formatarReais } from '../utils/formatacao';
import { ICONE_MODALIDADE } from '../utils/modalidades';

const TAMANHO_MAXIMO_OBJETIVO = 500;

/** RF10: limites da série semanal, os mesmos da API (backend/src/modules/aulas/aulas.schemas.ts). */
const MINIMO_DE_SEMANAS = 2;
const MAXIMO_DE_SEMANAS = 12;
const SEMANAS_PADRAO = 4;
const OPCOES_DE_SEMANAS = Array.from(
  { length: MAXIMO_DE_SEMANAS - MINIMO_DE_SEMANAS + 1 },
  (_, indice) => MINIMO_DE_SEMANAS + indice,
);

/** Erros em que a solução é escolher outro horário. */
const ERROS_DE_HORARIO = ['HORARIO_INDISPONIVEL', 'AULA_NO_PASSADO'];

const esquemaSolicitacao = z.object({
  materiaId: z.string().min(1, 'Escolha a matéria e o nível.'),
  modalidade: z.enum(['ONLINE', 'PRESENCIAL', 'DOMICILIO'], { error: 'Escolha a modalidade da aula.' }),
  objetivo: z.string().trim().max(TAMANHO_MAXIMO_OBJETIVO, `Use no máximo ${TAMANHO_MAXIMO_OBJETIVO} caracteres.`),
  frequencia: z.enum(['UNICA', 'SEMANAL']),
  semanas: z.coerce.number().int().min(MINIMO_DE_SEMANAS).max(MAXIMO_DE_SEMANAS),
});

type EntradaSolicitacao = z.input<typeof esquemaSolicitacao>;
type DadosSolicitacao = z.output<typeof esquemaSolicitacao>;

interface Horario {
  inicio: string;
  fim: string;
}

/** Lê o horário escolhido no perfil (?inicio=...&fim=...). Devolve null se faltar ou for inválido. */
function lerHorario(parametros: URLSearchParams): Horario | null {
  const inicio = parametros.get('inicio');
  const fim = parametros.get('fim');
  if (!inicio || !fim) return null;
  const inicioMs = new Date(inicio).getTime();
  const fimMs = new Date(fim).getTime();
  if (Number.isNaN(inicioMs) || Number.isNaN(fimMs) || fimMs <= inicioMs) return null;
  return { inicio, fim };
}

function textoDoHorario(horario: Horario): { dia: string; horas: string } {
  return {
    dia: diaPorExtenso(chaveDoDia(horario.inicio)),
    horas: `${horaCurta(horario.inicio)} às ${horaCurta(horario.fim)}`,
  };
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function Moldura({ professor, children }: { professor?: ProfessorDetalhe; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho />
      <main className="conteudo flex-1 pb-16 pt-6 sm:pb-24 sm:pt-10">
        <nav aria-label="Você está em" className="mb-8 text-sm">
          <ol className="flex flex-wrap items-center gap-1.5 text-suave">
            <li>
              <Link to="/professores" className="foco rounded font-semibold hover:text-primary">
                Encontrar professores
              </Link>
            </li>
            {professor && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link to={`/professores/${professor.id}`} className="foco rounded font-semibold hover:text-primary">
                    {professor.nome}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-tinta">
              Solicitar aula
            </li>
          </ol>
        </nav>
        {children}
      </main>
      <Rodape />
    </div>
  );
}

/** Mensagem de bloqueio (sem horário, perfil errado, horário ocupado...), com o caminho de volta. */
function Aviso({ titulo, texto, acao }: { titulo: string; texto: string; acao: ReactNode }) {
  return (
    <div className="cartao mx-auto max-w-xl p-8 text-center sm:p-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-tinta">{titulo}</h1>
      <p className="mt-2 text-suave">{texto}</p>
      <div className="mt-6 flex justify-center">{acao}</div>
    </div>
  );
}

function ResumoDoPedido({ professor, horario }: { professor: ProfessorDetalhe; horario: Horario }) {
  const { dia, horas } = textoDoHorario(horario);
  return (
    <aside aria-label="Resumo do pedido" className="cartao p-5 sm:p-6 lg:sticky lg:top-24">
      <div className="flex items-center gap-3">
        <AvatarProfessor id={professor.id} nome={professor.nome} />
        <div className="min-w-0">
          <p className="text-sm text-suave">Aula com</p>
          <p className="truncate font-bold text-tinta">{professor.nome}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
        <div className="flex items-start gap-3">
          <CalendarDays size={18} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
          <div>
            <dt className="sr-only">Dia</dt>
            <dd className="font-semibold text-tinta first-letter:uppercase">{dia}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock size={18} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
          <div>
            <dt className="sr-only">Horário</dt>
            <dd className="font-semibold text-tinta">
              {horas} <span className="font-normal text-suave">· horário de Brasília</span>
            </dd>
          </div>
        </div>
      </dl>
      <div className="mt-5 flex items-baseline justify-between border-t border-slate-200 pt-5">
        <span className="text-sm text-suave">Valor da aula</span>
        <span className="text-lg font-bold tabular-nums text-tinta">
          {professor.valorHora !== null ? formatarReais.format(professor.valorHora) : 'A consultar'}
        </span>
      </div>
      <p className="mt-2 text-xs text-suave">O pagamento é combinado com o professor. Nada é cobrado agora.</p>
      <Link
        to={`/professores/${professor.id}#horarios`}
        className="foco mt-5 inline-block rounded text-sm font-bold text-secondary hover:underline"
      >
        Trocar horário
      </Link>
    </aside>
  );
}

function OpcaoDeEscolha({ marcado, children, entrada }: { marcado: boolean; children: ReactNode; entrada: ReactNode }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors focus-within:ring-4 focus-within:ring-secondary/30 ${
        marcado ? 'border-secondary bg-secondary/5' : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {entrada}
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          marcado ? 'border-secondary' : 'border-slate-300'
        }`}
      >
        {marcado && <span className="h-2.5 w-2.5 rounded-full bg-secondary" />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

function PedidoEnviado({ professor, aulas }: { professor: ProfessorDetalhe; aulas: Aula[] }) {
  const [aula] = aulas;
  const { dia, horas } = textoDoHorario(aula);
  const serie = aulas.length > 1;
  return (
    <div className="cartao mx-auto max-w-xl p-8 text-center sm:p-10" aria-live="polite">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-menta/15 text-emerald-700">
        <CircleCheck size={28} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-tinta">Solicitação enviada</h1>
      <p className="mt-2 text-suave">
        {serie
          ? `${professor.nome} vai aceitar ou recusar cada uma das ${aulas.length} aulas.`
          : `${professor.nome} vai aceitar ou recusar o pedido.`}{' '}
        Você recebe um aviso aqui no AulaCerta quando houver resposta.
      </p>

      <dl className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 text-left text-sm">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-suave">Status</dt>
          <dd>
            <span className="rounded-full bg-ambar/15 px-2.5 py-1 text-xs font-bold text-amber-800">Solicitada</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-suave">{serie ? 'Primeira aula' : 'Quando'}</dt>
          <dd className="text-right font-semibold text-tinta first-letter:uppercase">
            {dia}, {horas}
          </dd>
        </div>
        {serie && (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-suave">Repetição</dt>
            <dd className="text-right font-semibold text-tinta">
              {aulas.length} aulas semanais, até {diaPorExtenso(chaveDoDia(aulas[aulas.length - 1].inicio))}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-suave">Matéria</dt>
          <dd className="text-right font-semibold text-tinta">
            {aula.materia.nome} · {aula.materia.nivel}
          </dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-suave">Modalidade</dt>
          <dd className="text-right font-semibold text-tinta">{ROTULO_MODALIDADE[aula.modalidade]}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/professores" className="botao-secundario">
          Encontrar outros professores
        </Link>
        <Link to="/minhas-aulas?aba=pendentes" className="botao-principal">
          Ver minhas aulas
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulário
// ---------------------------------------------------------------------------

function FormularioDeSolicitacao({
  professor,
  horario,
  aoEnviar,
}: {
  professor: ProfessorDetalhe;
  horario: Horario;
  aoEnviar: (aulas: Aula[]) => void;
}) {
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [horarioIndisponivel, setHorarioIndisponivel] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntradaSolicitacao, unknown, DadosSolicitacao>({
    resolver: zodResolver(esquemaSolicitacao),
    defaultValues: {
      // Com uma só opção, ela já vem marcada: um passo a menos (RNF01).
      materiaId: professor.materias.length === 1 ? professor.materias[0].id : '',
      modalidade: professor.modalidades.length === 1 ? professor.modalidades[0] : undefined,
      objetivo: '',
      frequencia: 'UNICA',
      semanas: SEMANAS_PADRAO,
    },
  });

  const materiaEscolhida = watch('materiaId');
  const modalidadeEscolhida = watch('modalidade');
  const tamanhoDoObjetivo = (watch('objetivo') ?? '').length;
  const semanal = watch('frequencia') === 'SEMANAL';
  const semanasEscolhidas = Number(watch('semanas')) || SEMANAS_PADRAO;

  async function enviar(dados: DadosSolicitacao) {
    setErroGeral(null);
    setHorarioIndisponivel(null);
    try {
      const pedido: DadosParaApi = {
        professorId: professor.id,
        materiaId: dados.materiaId,
        modalidade: dados.modalidade as Modalidade,
        inicio: horario.inicio,
        fim: horario.fim,
        objetivo: dados.objetivo || undefined,
      };
      if (dados.frequencia === 'SEMANAL') pedido.recorrencia = { semanas: dados.semanas };
      aoEnviar(await solicitarAula(pedido));
    } catch (erro) {
      const codigo = codigoDeErro(erro);
      if (codigo && ERROS_DE_HORARIO.includes(codigo)) {
        setHorarioIndisponivel(mensagemDeErro(erro, 'O horário escolhido não está mais disponível.'));
        return;
      }
      setErroGeral(mensagemDeErro(erro, 'Não foi possível enviar a solicitação. Tente novamente.'));
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">Solicitar aula</h1>
        <p className="mt-2 text-suave">Confira o horário e conte ao professor o que você precisa.</p>
      </div>

      {horarioIndisponivel && (
        <div role="alert" className="rounded-xl bg-error/10 px-4 py-4 text-sm text-error">
          <p className="font-bold">{horarioIndisponivel}</p>
          <p className="mt-1">
            {semanal
              ? 'Uma das semanas da série já está ocupada ou fora da agenda do professor. Escolha menos semanas ou outro horário.'
              : 'Outra pessoa pode ter reservado esse horário enquanto você preenchia o pedido.'}
          </p>
          <Link
            to={`/professores/${professor.id}#horarios`}
            className="foco mt-3 inline-block rounded font-bold underline"
          >
            Escolher outro horário
          </Link>
        </div>
      )}
      {erroGeral && <AlertaErro>{erroGeral}</AlertaErro>}

      <fieldset aria-describedby={errors.materiaId ? 'erro-materia' : undefined}>
        <legend className="text-lg font-bold text-tinta">Matéria e nível</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {professor.materias.map((materia) => (
            <OpcaoDeEscolha
              key={materia.id}
              marcado={materiaEscolhida === materia.id}
              entrada={<input type="radio" value={materia.id} className="sr-only" {...register('materiaId')} />}
            >
              <span className="block font-semibold text-tinta">{materia.nome}</span>
              <span className="block text-sm text-suave">{materia.nivel}</span>
            </OpcaoDeEscolha>
          ))}
        </div>
        {errors.materiaId && (
          <p id="erro-materia" className="mt-2 text-sm font-medium text-error">
            {errors.materiaId.message}
          </p>
        )}
      </fieldset>

      <fieldset aria-describedby={errors.modalidade ? 'erro-modalidade' : undefined}>
        <legend className="text-lg font-bold text-tinta">Modalidade</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {professor.modalidades.map((modalidade) => {
            const Icone = ICONE_MODALIDADE[modalidade];
            return (
              <OpcaoDeEscolha
                key={modalidade}
                marcado={modalidadeEscolhida === modalidade}
                entrada={<input type="radio" value={modalidade} className="sr-only" {...register('modalidade')} />}
              >
                <span className="flex items-center gap-2 font-semibold text-tinta">
                  <Icone size={16} className="text-secondary" aria-hidden="true" />
                  {ROTULO_MODALIDADE[modalidade]}
                </span>
              </OpcaoDeEscolha>
            );
          })}
        </div>
        {errors.modalidade && (
          <p id="erro-modalidade" className="mt-2 text-sm font-medium text-error">
            {errors.modalidade.message}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-tinta">Frequência</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <OpcaoDeEscolha
            marcado={!semanal}
            entrada={<input type="radio" value="UNICA" className="sr-only" {...register('frequencia')} />}
          >
            <span className="block font-semibold text-tinta">Só esta aula</span>
          </OpcaoDeEscolha>
          <OpcaoDeEscolha
            marcado={semanal}
            entrada={<input type="radio" value="SEMANAL" className="sr-only" {...register('frequencia')} />}
          >
            <span className="flex items-center gap-2 font-semibold text-tinta">
              <Repeat size={16} className="text-secondary" aria-hidden="true" />
              Toda semana
            </span>
            <span className="block text-sm text-suave">Mesmo dia e horário</span>
          </OpcaoDeEscolha>
        </div>
        {semanal && (
          <div className="mt-4">
            <label htmlFor="semanas" className="text-sm font-semibold text-tinta">
              Por quantas semanas?
            </label>
            <select
              id="semanas"
              aria-describedby="dica-semanas"
              className="mt-1.5 block h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-tinta focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30 sm:w-48"
              {...register('semanas')}
            >
              {OPCOES_DE_SEMANAS.map((quantidade) => (
                <option key={quantidade} value={quantidade}>
                  {quantidade} semanas
                </option>
              ))}
            </select>
            <p id="dica-semanas" className="mt-1.5 text-sm text-suave">
              {semanasEscolhidas} aulas, até {diaDaUltimaAula(horario.inicio, semanasEscolhidas)}. O professor aceita ou
              recusa cada aula, e todas as semanas precisam estar livres na agenda dele.
            </p>
          </div>
        )}
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="objetivo" className="text-lg font-bold text-tinta">
            Objetivo da aula <span className="text-sm font-normal text-suave">(opcional)</span>
          </label>
          <span className="text-xs tabular-nums text-suave" aria-live="polite">
            {tamanhoDoObjetivo}/{TAMANHO_MAXIMO_OBJETIVO}
          </span>
        </div>
        <textarea
          id="objetivo"
          rows={4}
          maxLength={TAMANHO_MAXIMO_OBJETIVO}
          placeholder="Ex.: tenho prova de funções na sexta e quero revisar os exercícios."
          aria-invalid={errors.objetivo ? true : undefined}
          aria-describedby="dica-objetivo"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-tinta placeholder:text-slate-400 focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30"
          {...register('objetivo')}
        />
        <p id="dica-objetivo" className="mt-1.5 text-sm text-suave">
          {errors.objetivo?.message ?? 'Ajuda o professor a preparar a aula: conteúdo, prova, dificuldade.'}
        </p>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <BotaoEnviar
          enviando={isSubmitting}
          rotulo={semanal ? `Solicitar ${semanasEscolhidas} aulas` : 'Enviar solicitação'}
          rotuloEnviando="Enviando…"
        />
        <p className="mt-3 text-center text-sm text-suave">
          O horário fica reservado para você quando o professor aceitar.
        </p>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export function PaginaSolicitarAula() {
  useTitulo('Solicitar aula');
  const { id = '' } = useParams();
  const [parametros] = useSearchParams();
  const horario = lerHorario(parametros);
  const { usuario } = useSessao();
  const clienteQuery = useQueryClient();
  const { data: professor, isPending, isError, refetch } = useProfessor(id);
  const [aulasCriadas, setAulasCriadas] = useState<Aula[] | null>(null);

  const voltarAoPerfil = (
    <Link to={`/professores/${id}#horarios`} className="botao-principal">
      Escolher horário
    </Link>
  );

  if (usuario && usuario.perfil !== 'ALUNO') {
    return (
      <Moldura professor={professor}>
        <Aviso
          titulo="Só alunos podem solicitar aulas"
          texto="Você entrou com uma conta de professor ou administrador. Para pedir uma aula, use uma conta de aluno."
          acao={
            <Link to="/professores" className="botao-secundario">
              Voltar para a busca
            </Link>
          }
        />
      </Moldura>
    );
  }

  if (isPending) {
    return (
      <Moldura>
        <div className="grid animate-pulse gap-10 lg:grid-cols-[1fr_22rem]" aria-hidden="true">
          <div className="space-y-4">
            <div className="h-9 w-1/2 rounded bg-slate-200" />
            <div className="h-24 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
          </div>
          <div className="cartao h-80" />
        </div>
      </Moldura>
    );
  }

  if (isError || !professor) {
    return (
      <Moldura>
        <Aviso
          titulo="Não foi possível carregar o professor"
          texto="Ocorreu um problema ao buscar os dados. Tente novamente."
          acao={
            <button type="button" onClick={() => refetch()} className="botao-secundario">
              <RefreshCw size={16} aria-hidden="true" />
              Tentar novamente
            </button>
          }
        />
      </Moldura>
    );
  }

  if (aulasCriadas && aulasCriadas.length > 0) {
    return (
      <Moldura professor={professor}>
        <PedidoEnviado professor={professor} aulas={aulasCriadas} />
      </Moldura>
    );
  }

  if (!horario) {
    return (
      <Moldura professor={professor}>
        <Aviso
          titulo="Escolha um horário"
          texto="Para solicitar a aula, escolha primeiro um dos horários livres do professor."
          acao={voltarAoPerfil}
        />
      </Moldura>
    );
  }

  // Confere com a agenda atual do professor: o link pode ser antigo.
  const inicioEscolhido = new Date(horario.inicio).getTime();
  const aindaLivre = professor.horariosLivres.some((livre) => new Date(livre.inicio).getTime() === inicioEscolhido);
  if (!aindaLivre) {
    return (
      <Moldura professor={professor}>
        <Aviso
          titulo="Este horário não está mais disponível"
          texto="Ele pode ter passado ou sido reservado por outra pessoa. Escolha outro horário na agenda do professor."
          acao={voltarAoPerfil}
        />
      </Moldura>
    );
  }

  return (
    <Moldura professor={professor}>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12">
        <div className="order-2 lg:order-1">
          <FormularioDeSolicitacao
            professor={professor}
            horario={horario}
            aoEnviar={(aulas) => {
              setAulasCriadas(aulas);
              window.scrollTo({ top: 0 });
              // A agenda do professor mudou: o perfil deve buscar os horários de novo.
              void clienteQuery.invalidateQueries({ queryKey: ['professor', id] });
            }}
          />
        </div>
        <div className="order-1 lg:order-2">
          <ResumoDoPedido professor={professor} horario={horario} />
        </div>
      </div>
    </Moldura>
  );
}
