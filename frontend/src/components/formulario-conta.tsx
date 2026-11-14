import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useSessao } from '../contexts/sessao';
import { mensagemDeErro } from '../services/api';
import { atualizarConta, errosPorCampo, type Usuario } from '../services/auth';
import { formatarTelefone } from '../utils/formatacao';
import { esquemaNome, esquemaTelefoneOpcional } from '../utils/validacoes';
import { Campo } from './campo';
import { AlertaErro, BotaoEnviar } from './layout-autenticacao';

// Mesmas regras da API (backend/src/modules/usuarios/usuarios.schemas.ts).
const esquemaConta = z.object({ nome: esquemaNome, telefone: esquemaTelefoneOpcional });

type EntradaConta = z.input<typeof esquemaConta>;
type DadosFormulario = z.output<typeof esquemaConta>;

const CAMPOS = ['nome', 'telefone'] as const;

/** Nome e telefone da própria conta, para qualquer perfil. O e-mail é só exibido. */
export function FormularioConta({ usuario, aoSalvar }: { usuario: Usuario; aoSalvar: (mensagem: string) => void }) {
  const { atualizarUsuario } = useSessao();
  const clienteQuery = useQueryClient();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaConta, unknown, DadosFormulario>({
    resolver: zodResolver(esquemaConta),
    defaultValues: {
      nome: usuario.nome,
      telefone: usuario.telefone ? formatarTelefone(usuario.telefone) : '',
    },
  });

  async function enviar(dados: DadosFormulario) {
    setErroGeral(null);
    try {
      const atualizado = await atualizarConta({ nome: dados.nome, telefone: dados.telefone || null });
      atualizarUsuario(atualizado);
      reset({
        nome: atualizado.nome,
        telefone: atualizado.telefone ? formatarTelefone(atualizado.telefone) : '',
      });
      // O nome do professor aparece na busca, no perfil público e nas aulas.
      await Promise.all(
        ['professor', 'professores', 'area-professor', 'aulas', 'aula'].map((chave) =>
          clienteQuery.invalidateQueries({ queryKey: [chave] }),
        ),
      );
      aoSalvar('Dados da conta salvos.');
    } catch (erro) {
      const porCampo = errosPorCampo(erro);
      const campos = CAMPOS.filter((campo) => porCampo[campo]);
      campos.forEach((campo) => setError(campo, { message: porCampo[campo] }));
      if (campos.length === 0)
        setErroGeral(mensagemDeErro(erro, 'Não foi possível salvar seus dados. Tente novamente.'));
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-6">
      {erroGeral && <AlertaErro>{erroGeral}</AlertaErro>}

      <Campo rotulo="Nome completo" autoComplete="name" erro={errors.nome?.message} {...register('nome')} />
      <Campo
        rotulo="E-mail"
        type="email"
        value={usuario.email}
        readOnly
        dica="O e-mail é usado para entrar e não pode ser alterado."
        className="[&_input]:bg-surface [&_input]:text-suave"
      />
      <Campo
        rotulo="Telefone (opcional)"
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        placeholder="61 99999-9999"
        dica="Com DDD. Só aparece para o outro usuário depois que a aula for confirmada. Deixe em branco para remover."
        erro={errors.telefone?.message}
        {...register('telefone')}
      />

      <div className="border-t border-slate-200 pt-6">
        <div className="sm:max-w-xs">
          <BotaoEnviar enviando={isSubmitting} rotulo="Salvar dados" rotuloEnviando="Salvando…" />
        </div>
      </div>
    </form>
  );
}
