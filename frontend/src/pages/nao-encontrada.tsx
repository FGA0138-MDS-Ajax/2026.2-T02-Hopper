import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Cabecalho } from '../components/cabecalho';
import { Rodape } from '../components/rodape';
import { useTitulo } from '../hooks/use-titulo';

/** 404: endereço que não existe no AulaCerta. */
export function PaginaNaoEncontrada() {
  useTitulo('Página não encontrada');
  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho />
      <main className="conteudo flex flex-1 flex-col items-start justify-center gap-4 py-20">
        <p className="text-sm font-bold uppercase tracking-wide text-secondary">Erro 404</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-5xl">Página não encontrada.</h1>
        <p className="max-w-lg text-suave">
          O endereço pode estar errado ou a página pode ter mudado de lugar. Confira o link ou volte para o início.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="botao-secundario">
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar ao início
          </Link>
          <Link to="/professores" className="botao-principal">
            <Search size={18} aria-hidden="true" />
            Encontrar professores
          </Link>
        </div>
      </main>
      <Rodape />
    </div>
  );
}
