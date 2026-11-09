import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Campo } from '../components/campo';
import { AlertaErro, BotaoEnviar, LayoutAutenticacao } from '../components/layout-autenticacao';
import { useTitulo } from '../hooks/use-titulo';
import { mensagemDeErro } from '../services/api';
import { codigoDeErro, redefinirSenha } from '../services/auth';
import { DICA_SENHA, esquemaSenhaNova } from '../utils/validacoes';

const esquemaRedefinir = z
  .object({
    novaSenha: esquemaSenhaNova,
    confirmacao: z.string().min(1, 'Repita a nova senha.'),
  })
  .refine((dados) => dados.novaSenha === dados.confirmacao, {
    message: 'As senhas não são iguais.',
    path: ['confirmacao'],
  });

type DadosRedefinir = z.infer<typeof esquemaRedefinir>;

function LinkInvalido() {
  return (
    <LayoutAutenticacao titulo="Link inválido ou expirado">
      <p className="text-center text-sm text-suave">
        Este link de redefinição não vale mais. Os links valem por 1 hora e só podem ser usados uma vez.
      </p>
      <Link to="/recuperar-senha" className="botao-principal mt-6 w-full">
        Pedir um novo link
      </Link>
    </LayoutAutenticacao>
  );
}

/** RF03: cria a nova senha a partir do link recebido por e-mail (/redefinir-senha?token=...). */
export function PaginaRedefinirSenha() {
  useTitulo('Criar nova senha');
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const token = parametros.get('token')?.trim() ?? '';
  const [tokenRecusado, setTokenRecusado] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosRedefinir>({ resolver: zodResolver(esquemaRedefinir) });

  if (!token || tokenRecusado) return <LinkInvalido />;

  async function enviar(dados: DadosRedefinir) {
    setErroGeral(null);
    try {
      await redefinirSenha(token, dados.novaSenha);
      navegar('/entrar?senha=redefinida', { replace: true });
    } catch (erro) {
      if (codigoDeErro(erro) === 'TOKEN_INVALIDO') {
        setTokenRecusado(true);
        return;
      }
      setErroGeral(mensagemDeErro(erro, 'Não foi possível alterar a senha. Tente novamente.'));
    }
  }

  return (
    <LayoutAutenticacao titulo="Criar nova senha" subtitulo="Escolha uma senha que você ainda não usou no AulaCerta.">
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5">
        {erroGeral && <AlertaErro>{erroGeral}</AlertaErro>}
        <Campo
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          autoFocus
          dica={DICA_SENHA}
          erro={errors.novaSenha?.message}
          {...register('novaSenha')}
        />
        <Campo
          rotulo="Repita a nova senha"
          type="password"
          autoComplete="new-password"
          erro={errors.confirmacao?.message}
          {...register('confirmacao')}
        />
        <BotaoEnviar enviando={isSubmitting} rotulo="Salvar nova senha" rotuloEnviando="Salvando…" />
      </form>
    </LayoutAutenticacao>
  );
}
