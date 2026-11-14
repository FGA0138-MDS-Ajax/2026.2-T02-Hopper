import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, GraduationCap } from 'lucide-react';
import { Campo } from '../components/campo';
import { AlertaErro, BotaoEnviar, LayoutAutenticacao } from '../components/layout-autenticacao';
import { useSessao } from '../contexts/sessao';
import { useTitulo } from '../hooks/use-titulo';
import { mensagemDeErro } from '../services/api';
import { codigoDeErro, errosPorCampo } from '../services/auth';
import { comVoltar, destinoSeguro } from '../utils/redirecionamento';
import { DICA_SENHA, esquemaEmail, esquemaNome, esquemaSenhaNova, esquemaTelefoneOpcional } from '../utils/validacoes';

// Mesmas regras da API (backend/src/modules/auth/auth.schemas.ts).
const esquemaCadastro = z.object({
  perfil: z.enum(['ALUNO', 'PROFESSOR']),
  nome: esquemaNome,
  email: esquemaEmail,
  telefone: esquemaTelefoneOpcional,
  senha: esquemaSenhaNova,
  consentimentoLgpd: z.boolean().refine((aceito) => aceito, 'Para criar a conta, aceite a Política de privacidade.'),
});

type EntradaCadastro = z.input<typeof esquemaCadastro>;
type DadosCadastro = z.output<typeof esquemaCadastro>;

const CAMPOS = ['perfil', 'nome', 'email', 'telefone', 'senha', 'consentimentoLgpd'] as const;

const OPCOES_DE_PERFIL = [
  {
    valor: 'ALUNO',
    titulo: 'Quero aprender',
    texto: 'Encontre professores e agende aulas.',
    icone: BookOpen,
  },
  {
    valor: 'PROFESSOR',
    titulo: 'Quero dar aulas',
    texto: 'Publique seus horários e receba solicitações.',
    icone: GraduationCap,
  },
] as const;

export function PaginaCadastro() {
  useTitulo('Criar conta');
  const { usuario, cadastrar } = useSessao();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const voltar = parametros.get('voltar');
  const destino = destinoSeguro(voltar);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntradaCadastro, unknown, DadosCadastro>({
    resolver: zodResolver(esquemaCadastro),
    defaultValues: {
      perfil: parametros.get('perfil') === 'PROFESSOR' ? 'PROFESSOR' : 'ALUNO',
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      consentimentoLgpd: false,
    },
  });
  const perfilEscolhido = watch('perfil');

  if (usuario) return <Navigate to={destino} replace />;

  async function enviar(dados: DadosCadastro) {
    setErroGeral(null);
    try {
      await cadastrar({ ...dados, telefone: dados.telefone || undefined });
      // Professor novo vai direto completar o perfil: sem ele, não aparece na busca.
      const proximo = dados.perfil === 'PROFESSOR' && !voltar ? '/meu-perfil?bem-vindo=1' : destino;
      navegar(proximo, { replace: true });
    } catch (erro) {
      if (codigoDeErro(erro) === 'EMAIL_JA_CADASTRADO') {
        setError(
          'email',
          { message: 'Este e-mail já tem uma conta. Entre ou use outro e-mail.' },
          { shouldFocus: true },
        );
        return;
      }
      const porCampo = errosPorCampo(erro);
      const campos = CAMPOS.filter((campo) => porCampo[campo]);
      campos.forEach((campo) => setError(campo, { message: porCampo[campo] }));
      if (campos.length === 0) setErroGeral(mensagemDeErro(erro, 'Não foi possível criar a conta. Tente novamente.'));
    }
  }

  return (
    <LayoutAutenticacao
      titulo="Criar conta"
      subtitulo="Leva menos de um minuto."
      aviso={voltar?.includes('/solicitar') ? 'Crie sua conta para concluir a solicitação da aula.' : undefined}
      rodape={
        <p className="text-center text-sm text-suave">
          Já tem conta?{' '}
          <Link to={comVoltar('/entrar', voltar)} className="foco rounded font-bold text-secondary hover:underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5">
        {erroGeral && <AlertaErro>{erroGeral}</AlertaErro>}

        <fieldset>
          <legend className="text-sm font-semibold text-tinta">Como você vai usar o AulaCerta?</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {OPCOES_DE_PERFIL.map((opcao) => {
              const marcado = perfilEscolhido === opcao.valor;
              return (
                <label
                  key={opcao.valor}
                  className={`relative flex cursor-pointer flex-col rounded-xl border p-3 transition-colors focus-within:ring-4 focus-within:ring-secondary/30 ${
                    marcado ? 'border-secondary bg-secondary/5' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <input type="radio" value={opcao.valor} className="sr-only" {...register('perfil')} />
                  <opcao.icone size={20} className={marcado ? 'text-secondary' : 'text-suave'} aria-hidden="true" />
                  <span className="mt-2 text-sm font-bold text-tinta">{opcao.titulo}</span>
                  <span className="mt-0.5 text-xs text-suave">{opcao.texto}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Campo rotulo="Nome completo" autoComplete="name" erro={errors.nome?.message} {...register('nome')} />
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          erro={errors.email?.message}
          {...register('email')}
        />
        <Campo
          rotulo="Telefone (opcional)"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="61 99999-9999"
          dica="Com DDD. Só aparece para o outro usuário depois que a aula for confirmada."
          erro={errors.telefone?.message}
          {...register('telefone')}
        />
        <Campo
          rotulo="Senha"
          type="password"
          autoComplete="new-password"
          dica={DICA_SENHA}
          erro={errors.senha?.message}
          {...register('senha')}
        />

        <div>
          <label className="flex items-start gap-3 text-sm text-suave">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/30"
              aria-invalid={errors.consentimentoLgpd ? true : undefined}
              aria-describedby={errors.consentimentoLgpd ? 'erro-consentimento' : undefined}
              {...register('consentimentoLgpd')}
            />
            <span>
              Li e aceito a{' '}
              <Link
                to="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="foco rounded font-semibold text-secondary underline"
              >
                Política de privacidade
              </Link>{' '}
              e autorizo o uso dos meus dados para usar o AulaCerta.
            </span>
          </label>
          {errors.consentimentoLgpd && (
            <p id="erro-consentimento" className="mt-1.5 text-sm font-medium text-error">
              {errors.consentimentoLgpd.message}
            </p>
          )}
        </div>

        <BotaoEnviar enviando={isSubmitting} rotulo="Criar conta" rotuloEnviando="Criando conta…" />
      </form>
    </LayoutAutenticacao>
  );
}
