import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Cabecalho } from '../components/cabecalho';
import { useTitulo } from '../hooks/use-titulo';

/** Temporária: ocupa as rotas das telas que ainda serão construídas. */
export function PaginaEmConstrucao() {
  useTitulo('Em construção');
  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho />
      <main className="conteudo flex flex-1 flex-col items-start justify-center gap-4 py-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-5xl">Esta tela está a caminho.</h1>
        <p className="max-w-lg text-suave">Ela faz parte das próximas entregas do AulaCerta.</p>
        <Link to="/" className="botao-secundario mt-4">
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar ao início
        </Link>
      </main>
    </div>
  );
}
