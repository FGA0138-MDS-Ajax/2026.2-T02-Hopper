import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Campo } from '../components/campo';
import { AlertaErro, BotaoEnviar, LayoutAutenticacao } from '../components/layout-autenticacao';
import { useSessao } from '../contexts/sessao';
import { useTitulo } from '../hooks/use-titulo';
import { mensagemDeErro } from '../services/api';
import { comVoltar, destinoSeguro } from '../utils/redirecionamento';
import { esquemaEmail } from '../utils/validacoes';

const esquemaEntrar = z.object({
  email: esquemaEmail,
  senha: z.string().min(1, 'Informe sua senha.'),
});

type DadosEntrar = z.infer<typeof esquemaEntrar>;

/** Explica por que a pessoa caiu no login, quando ela veio de uma ação que exige conta. */
function avisoDoDestino(voltar: string | null): string | undefined {
  if (voltar?.includes('/solicitar')) return 'Entre na sua conta para concluir a solicitação da aula.';
  if (voltar) return 'Entre na sua conta para continuar.';
  return undefined;
}

export function PaginaEntrar() {
  useTitulo('Entrar');
  const { usuario, entrar } = useSessao();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const voltar = parametros.get('voltar');
  const destino = destinoSeguro(voltar);
  const senhaRedefinida = parametros.get('senha') === 'redefinida';
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosEntrar>({ resolver: zodResolver(esquemaEntrar) });

  if (usuario) return <Navigate to={destino} replace />;

  async function enviar(dados: DadosEntrar) {
    setErroGeral(null);
    try {
      await entrar(dados.email, dados.senha);
      navegar(destino, { replace: true });
    } catch (erro) {
      // A API responde a mesma mensagem para e-mail ou senha errados (CT02).
      setErroGeral(mensagemDeErro(erro, 'Não foi possível entrar. Tente novamente.'));
    }
  }

  return (
    <LayoutAutenticacao
      titulo="Entrar no AulaCerta"
      subtitulo="Acesse sua conta para agendar e acompanhar suas aulas."
      aviso={senhaRedefinida ? 'Senha alterada. Entre com a nova senha.' : avisoDoDestino(voltar)}
      rodape={
        <div className="text-center">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
            Novo no AulaCerta?
            <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
          </p>
          <Link to={comVoltar('/cadastro', voltar)} className="botao-secundario mt-4 w-full">
            Criar conta
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5">
        {erroGeral && <AlertaErro>{erroGeral}</AlertaErro>}
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          erro={errors.email?.message}
          {...register('email')}
        />
        <Campo
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          erro={errors.senha?.message}
          acaoDoRotulo={
            <Link to="/recuperar-senha" className="foco rounded text-sm font-semibold text-secondary hover:underline">
              Esqueci minha senha
            </Link>
          }
          {...register('senha')}
        />
        <BotaoEnviar enviando={isSubmitting} rotulo="Entrar" rotuloEnviando="Entrando…" />
      </form>
    </LayoutAutenticacao>
  );
}
