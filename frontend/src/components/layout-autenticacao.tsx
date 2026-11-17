import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './logo';

/**
 * Moldura das telas de conta (entrar, criar conta, recuperar senha): a marca centralizada,
 * o formulário num cartão e nada mais disputando a atenção.
 */
export function LayoutAutenticacao({
  titulo,
  subtitulo,
  aviso,
  children,
  rodape,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  /** Contexto de por que a pessoa está aqui (ex.: "Entre para solicitar sua aula."). */
  aviso?: ReactNode;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:justify-center sm:py-16">
      <Link to="/" className="foco mb-8 rounded-xl" aria-label="AulaCerta, voltar para a página inicial">
        <Logo className="scale-110" />
      </Link>

      <main className="w-full max-w-[26rem]">
        {aviso && (
          <p
            role="status"
            className="mb-4 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm text-primary"
          >
            {aviso}
          </p>
        )}
        <div className="cartao p-6 sm:p-8">
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-tinta">{titulo}</h1>
          {subtitulo && <p className="mt-2 text-center text-sm text-suave">{subtitulo}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {rodape && <div className="mt-6">{rodape}</div>}
      </main>

      <footer className="mt-10 flex gap-5 text-xs text-suave">
        <Link to="/" className="foco rounded hover:text-primary">
          Voltar ao início
        </Link>
        <Link to="/privacidade" className="foco rounded hover:text-primary">
          Política de privacidade
        </Link>
      </footer>
    </div>
  );
}

/** Botão de envio com indicador de carregamento. */
export function BotaoEnviar({
  enviando,
  rotulo,
  rotuloEnviando,
}: {
  enviando: boolean;
  rotulo: string;
  rotuloEnviando: string;
}) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className="botao-principal w-full disabled:cursor-wait disabled:opacity-70"
    >
      {enviando && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {enviando ? rotuloEnviando : rotulo}
    </button>
  );
}

/** Mensagem de erro geral do formulário (anunciada por leitores de tela). */
export function AlertaErro({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
      {children}
    </p>
  );
}
