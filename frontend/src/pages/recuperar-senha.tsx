import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Campo } from '../components/campo';
import { AlertaErro, BotaoEnviar, LayoutAutenticacao } from '../components/layout-autenticacao';
import { useTitulo } from '../hooks/use-titulo';
import { mensagemDeErro } from '../services/api';
import { solicitarRecuperacaoDeSenha } from '../services/auth';
import { esquemaEmail } from '../utils/validacoes';

const esquemaRecuperar = z.object({ email: esquemaEmail });
type DadosRecuperar = z.infer<typeof esquemaRecuperar>;

const VoltarParaEntrar = (
  <p className="text-center text-sm">
    <Link to="/entrar" className="foco inline-flex items-center gap-1.5 rounded font-bold text-secondary hover:underline">
      <ArrowLeft size={16} aria-hidden="true" />
      Voltar para entrar
    </Link>
  </p>
);

/** RF03: pede o link de redefinição por e-mail. */
export function PaginaRecuperarSenha() {
  useTitulo('Recuperar senha');
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosRecuperar>({ resolver: zodResolver(esquemaRecuperar) });

  async function enviar(dados: DadosRecuperar) {
    setErroGeral(null);
    try {
      await solicitarRecuperacaoDeSenha(dados.email);
      setEmailEnviado(dados.email.trim());
    } catch (erro) {
      setErroGeral(mensagemDeErro(erro, 'Não foi possível enviar o e-mail agora. Tente novamente.'));
    }
  }

  if (emailEnviado) {
    return (
      <LayoutAutenticacao titulo="Verifique seu e-mail" rodape={VoltarParaEntrar}>
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-menta/15 text-emerald-700">
            <MailCheck size={24} aria-hidden="true" />
          </span>
          {/* A mensagem é a mesma exista ou não a conta: não revela quem é cadastrado. */}
          <p className="mt-4 text-sm text-suave" role="status">
            Se houver uma conta com <span className="font-semibold text-tinta">{emailEnviado}</span>, enviamos um link
            para criar uma nova senha. O link vale por 1 hora.
          </p>
          <p className="mt-3 text-sm text-suave">Não chegou? Confira a caixa de spam ou peça outro link.</p>
          <button type="button" onClick={() => setEmailEnviado(null)} className="botao-secundario mt-6 w-full">
            Enviar outro link
          </button>
        </div>
      </LayoutAutenticacao>
    );
  }

  return (
    <LayoutAutenticacao
      titulo="Recuperar senha"
      subtitulo="Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha."
      rodape={VoltarParaEntrar}
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
        <BotaoEnviar enviando={isSubmitting} rotulo="Enviar link" rotuloEnviando="Enviando…" />
      </form>
    </LayoutAutenticacao>
  );
}
