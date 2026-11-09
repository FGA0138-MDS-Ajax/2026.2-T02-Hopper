import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Circle, RefreshCw } from 'lucide-react';
import { Abas, PainelDeAba } from '../components/abas';
import { EditorGrade } from '../components/area-professor/editor-grade';
import { FormularioPerfil } from '../components/area-professor/formulario-perfil';
import { GerenciarBloqueios } from '../components/area-professor/gerenciar-bloqueios';
import { AvisoSucesso } from '../components/aviso-sucesso';
import { Cabecalho } from '../components/cabecalho';
import { Rodape } from '../components/rodape';
import { useSessao } from '../contexts/sessao';
import { useGrade, useMeuPerfil } from '../hooks/use-area-professor';
import { useTitulo } from '../hooks/use-titulo';
import type { FaixaHoraria, MeuPerfil } from '../services/area-professor';

type IdAba = 'perfil' | 'grade' | 'bloqueios';

const ABAS: { id: IdAba; rotulo: string }[] = [
  { id: 'perfil', rotulo: 'Perfil' },
  { id: 'grade', rotulo: 'Grade semanal' },
  { id: 'bloqueios', rotulo: 'Bloqueios' },
];

function ehAba(valor: string | null): valor is IdAba {
  return valor === 'perfil' || valor === 'grade' || valor === 'bloqueios';
}

/** O que falta para o professor aparecer na busca e receber pedidos. */
function Situacao({ perfil, grade }: { perfil: MeuPerfil; grade: FaixaHoraria[] }) {
  const itens = [
    { rotulo: 'Apresentação', feito: perfil.apresentacao.trim() !== '' },
    { rotulo: 'Matérias e níveis', feito: perfil.materias.length > 0 },
    { rotulo: 'Modalidades', feito: perfil.modalidades.length > 0 },
    { rotulo: 'Valor da hora-aula', feito: perfil.valorHora !== null },
    { rotulo: 'Grade semanal', feito: grade.length > 0 },
  ];
  const pronto = perfil.completo && grade.length > 0;

  let titulo = 'Complete seu perfil para aparecer na busca';
  let texto = 'Enquanto faltar algum item, os alunos não encontram você.';
  if (pronto) {
    titulo = 'Seu perfil está visível na busca';
    texto = 'Os alunos já podem encontrar você e pedir aulas nos horários livres.';
  } else if (perfil.completo) {
    titulo = 'Falta só a grade semanal';
    texto = 'Seu perfil aparece na busca, mas sem horários os alunos não conseguem pedir aulas.';
  }

  return (
    <section
      aria-label="Situação do perfil"
      className={`rounded-2xl border p-5 sm:p-6 ${pronto ? 'border-menta/40 bg-menta/10' : 'border-ambar/40 bg-ambar/10'}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-bold text-tinta">{titulo}</h2>
          <p className="mt-1 text-sm text-suave">{texto}</p>
        </div>
        {perfil.completo && (
          <Link
            to={`/professores/${perfil.id}`}
            className="foco inline-flex shrink-0 items-center gap-1.5 rounded text-sm font-bold text-secondary hover:underline"
          >
            Ver como os alunos veem
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {itens.map((item) => (
          <li key={item.rotulo} className="flex items-center gap-1.5 text-sm">
            {item.feito ? (
              <Check size={16} className="text-emerald-700" aria-hidden="true" />
            ) : (
              <Circle size={14} className="text-slate-400" aria-hidden="true" />
            )}
            <span className={item.feito ? 'text-tinta' : 'text-suave'}>
              {item.rotulo}
              <span className="sr-only">{item.feito ? ': preenchido' : ': falta preencher'}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

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

/** Área do professor: perfil (RF04), grade semanal (RF05) e bloqueios (RF06). */
export function PaginaMeuPerfil() {
  useTitulo('Meu perfil');
  const { usuario } = useSessao();
  const [parametros, setParametros] = useSearchParams();
  const ehProfessor = usuario?.perfil === 'PROFESSOR';
  const perfil = useMeuPerfil(ehProfessor);
  const grade = useGrade(ehProfessor);
  const [mensagem, setMensagem] = useState<string | null>(
    parametros.get('bem-vindo') ? 'Conta criada! Complete seu perfil e sua grade para começar a receber pedidos.' : null,
  );

  if (!usuario) return null; // A rota é protegida; isto só acontece durante o redirecionamento.

  if (!ehProfessor) {
    return (
      <Moldura>
        <div className="cartao p-10 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">Área do professor</h1>
          <p className="mt-2 text-suave">Esta área é para contas de professor.</p>
          <Link to="/" className="botao-secundario mt-6">
            Voltar ao início
          </Link>
        </div>
      </Moldura>
    );
  }

  const idAba: IdAba = ehAba(parametros.get('aba')) ? (parametros.get('aba') as IdAba) : 'perfil';

  function escolherAba(id: IdAba) {
    setParametros(id === 'perfil' ? {} : { aba: id }, { replace: true });
  }

  function avisar(texto: string) {
    setMensagem(texto);
    window.scrollTo({ top: 0 });
  }

  const carregando = perfil.isPending || grade.isPending;
  const falhou = perfil.isError || grade.isError;

  return (
    <Moldura>
      <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">Meu perfil</h1>
      <p className="mt-2 text-suave">O que os alunos veem sobre você e quando você pode dar aulas.</p>

      {mensagem && (
        <div className="mt-6">
          <AvisoSucesso aoFechar={() => setMensagem(null)}>{mensagem}</AvisoSucesso>
        </div>
      )}

      {carregando && <div className="mt-8 h-32 animate-pulse rounded-2xl bg-slate-100" aria-hidden="true" />}

      {falhou && (
        <div className="cartao mt-8 flex flex-col items-center gap-2 p-10 text-center">
          <p className="font-bold text-tinta">Não foi possível carregar seu perfil.</p>
          <button
            type="button"
            onClick={() => {
              void perfil.refetch();
              void grade.refetch();
            }}
            className="botao-secundario mt-3"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      )}

      {perfil.data && grade.data && (
        <>
          <div className="mt-8">
            <Situacao perfil={perfil.data} grade={grade.data} />
          </div>

          <div className="mt-10">
            <Abas rotulo="Seções do perfil" abas={ABAS} selecionada={idAba} aoEscolher={escolherAba} />
          </div>
          <PainelDeAba id={idAba} className="pt-8">
            {idAba === 'perfil' && <FormularioPerfil perfil={perfil.data} aoSalvar={avisar} />}
            {idAba === 'grade' && <EditorGrade grade={grade.data} aoSalvar={avisar} />}
            {idAba === 'bloqueios' && <GerenciarBloqueios aoAlterar={avisar} />}
          </PainelDeAba>
        </>
      )}
    </Moldura>
  );
}
