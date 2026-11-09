import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSalvarPerfil } from '../../hooks/use-area-professor';
import { useMaterias } from '../../hooks/use-professores';
import { mensagemDeErro } from '../../services/api';
import type { MeuPerfil } from '../../services/area-professor';
import { ROTULO_MODALIDADE, type Materia, type Modalidade } from '../../services/professores';
import { AlertaErro, BotaoEnviar } from '../layout-autenticacao';
import { ICONE_MODALIDADE } from '../professor-info';

// Mesmos limites da API (backend/src/modules/usuarios/usuarios.schemas.ts).
const TAMANHO_MAXIMO_APRESENTACAO = 1000;
const MAXIMO_DE_MATERIAS = 20;
const VALOR_HORA_MAXIMO = 10_000;
const MODALIDADES = Object.keys(ROTULO_MODALIDADE) as Modalidade[];

/** "90", "90,50", "R$ 1.200,00" → número; texto inválido → NaN. */
export function lerValorEmReais(texto: string): number {
  let limpo = texto.replace(/R\$|\s/g, '');
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.');
  return limpo === '' ? Number.NaN : Number(limpo);
}

const esquemaPerfil = z.object({
  apresentacao: z
    .string()
    .trim()
    .min(1, 'Escreva uma apresentação para os alunos.')
    .max(TAMANHO_MAXIMO_APRESENTACAO, `Use no máximo ${TAMANHO_MAXIMO_APRESENTACAO} caracteres.`),
  materiaIds: z
    .array(z.string())
    .min(1, 'Escolha pelo menos uma matéria e nível.')
    .max(MAXIMO_DE_MATERIAS, `Escolha no máximo ${MAXIMO_DE_MATERIAS} matérias.`),
  modalidades: z.array(z.enum(['ONLINE', 'PRESENCIAL', 'DOMICILIO'])).min(1, 'Escolha pelo menos uma modalidade.'),
  // Fica como texto no formulário; vira número só no envio (lerValorEmReais).
  valorHora: z
    .string()
    .refine((texto) => {
      const valor = lerValorEmReais(texto);
      return Number.isFinite(valor) && valor > 0;
    }, 'Informe o valor da hora-aula, por exemplo 80 ou 80,50.')
    .refine((texto) => !(lerValorEmReais(texto) > VALOR_HORA_MAXIMO), 'O valor máximo é R$ 10.000.')
    .refine((texto) => {
      const valor = lerValorEmReais(texto);
      return !Number.isFinite(valor) || Math.round(valor * 100) === valor * 100;
    }, 'Use no máximo dois dígitos de centavos.'),
});

type DadosPerfil = z.infer<typeof esquemaPerfil>;

function agruparPorNome(materias: Materia[]): { nome: string; opcoes: Materia[] }[] {
  const grupos = new Map<string, Materia[]>();
  for (const materia of materias) grupos.set(materia.nome, [...(grupos.get(materia.nome) ?? []), materia]);
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([nome, opcoes]) => ({ nome, opcoes }));
}

function valorInicial(valor: number | null): string {
  return valor === null ? '' : valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

/** RF04: apresentação, matérias e níveis, modalidades e valor da hora-aula. */
export function FormularioPerfil({ perfil, aoSalvar }: { perfil: MeuPerfil; aoSalvar: (mensagem: string) => void }) {
  const { data: materias, isPending: carregandoMaterias } = useMaterias();
  const salvar = useSalvarPerfil();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<DadosPerfil>({
    resolver: zodResolver(esquemaPerfil),
    defaultValues: {
      apresentacao: perfil.apresentacao,
      materiaIds: perfil.materias.map((materia) => materia.id),
      modalidades: perfil.modalidades,
      valorHora: valorInicial(perfil.valorHora),
    },
  });

  const tamanhoApresentacao = (watch('apresentacao') ?? '').length;
  const materiasMarcadas = watch('materiaIds') ?? [];
  const modalidadesMarcadas = watch('modalidades') ?? [];

  /** Liga/desliga um item da lista (controlado: o valor é sempre uma lista, mesmo com uma só opção). */
  function alternarMateria(id: string) {
    const proxima = materiasMarcadas.includes(id)
      ? materiasMarcadas.filter((item) => item !== id)
      : [...materiasMarcadas, id];
    setValue('materiaIds', proxima, { shouldValidate: isSubmitted, shouldDirty: true });
  }

  function alternarModalidade(modalidade: Modalidade) {
    const proxima = modalidadesMarcadas.includes(modalidade)
      ? modalidadesMarcadas.filter((item) => item !== modalidade)
      : [...modalidadesMarcadas, modalidade];
    setValue('modalidades', proxima, { shouldValidate: isSubmitted, shouldDirty: true });
  }

  async function enviar(dados: DadosPerfil) {
    setErroGeral(null);
    try {
      const atualizado = await salvar.mutateAsync({ ...dados, valorHora: lerValorEmReais(dados.valorHora) });
      aoSalvar(
        atualizado.completo
          ? 'Perfil salvo. Os alunos já veem as mudanças.'
          : 'Perfil salvo. Complete os itens que faltam para aparecer na busca.',
      );
    } catch (erro) {
      setErroGeral(mensagemDeErro(erro, 'Não foi possível salvar o perfil. Tente novamente.'));
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-8">
      {erroGeral && <AlertaErro>{erroGeral}</AlertaErro>}

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="apresentacao" className="text-lg font-bold text-tinta">
            Apresentação
          </label>
          <span className="text-xs tabular-nums text-suave">
            {tamanhoApresentacao}/{TAMANHO_MAXIMO_APRESENTACAO}
          </span>
        </div>
        <textarea
          id="apresentacao"
          rows={5}
          maxLength={TAMANHO_MAXIMO_APRESENTACAO}
          placeholder="Conte sua formação, experiência e como são suas aulas."
          aria-invalid={errors.apresentacao ? true : undefined}
          aria-describedby="dica-apresentacao"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-tinta placeholder:text-slate-400 focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30"
          {...register('apresentacao')}
        />
        <p id="dica-apresentacao" className={`mt-1.5 text-sm ${errors.apresentacao ? 'font-medium text-error' : 'text-suave'}`}>
          {errors.apresentacao?.message ?? 'Aparece no seu perfil público, em "Sobre o professor".'}
        </p>
      </div>

      <fieldset aria-describedby={errors.materiaIds ? 'erro-materias' : undefined}>
        <legend className="text-lg font-bold text-tinta">Matérias e níveis</legend>
        <p className="mt-1 text-sm text-suave">Marque cada nível em que você dá aula.</p>
        {carregandoMaterias ? (
          <p className="mt-3 text-sm text-suave">Carregando matérias…</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {agruparPorNome(materias ?? []).map((grupo) => (
              <li key={grupo.nome} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-tinta">{grupo.nome}</span>
                <div className="flex flex-wrap gap-2">
                  {grupo.opcoes.map((opcao) => {
                    const marcada = materiasMarcadas.includes(opcao.id);
                    return (
                      <label
                        key={opcao.id}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors focus-within:ring-4 focus-within:ring-secondary/30 ${
                          marcada ? 'border-secondary bg-secondary/10 text-secondary' : 'border-slate-300 text-tinta'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={marcada}
                          onChange={() => alternarMateria(opcao.id)}
                          className="h-4 w-4 accent-secondary"
                          aria-label={`${grupo.nome}, ${opcao.nivel}`}
                        />
                        {opcao.nivel}
                      </label>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
        {errors.materiaIds && (
          <p id="erro-materias" className="mt-2 text-sm font-medium text-error">
            {errors.materiaIds.message}
          </p>
        )}
      </fieldset>

      <fieldset aria-describedby={errors.modalidades ? 'erro-modalidades' : undefined}>
        <legend className="text-lg font-bold text-tinta">Modalidades</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {MODALIDADES.map((modalidade) => {
            const Icone = ICONE_MODALIDADE[modalidade];
            const marcada = modalidadesMarcadas.includes(modalidade);
            return (
              <label
                key={modalidade}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors focus-within:ring-4 focus-within:ring-secondary/30 ${
                  marcada ? 'border-secondary bg-secondary/5' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcada}
                  onChange={() => alternarModalidade(modalidade)}
                  className="h-4 w-4 accent-secondary"
                />
                <Icone size={16} className="text-secondary" aria-hidden="true" />
                <span className="font-semibold text-tinta">{ROTULO_MODALIDADE[modalidade]}</span>
              </label>
            );
          })}
        </div>
        {errors.modalidades && (
          <p id="erro-modalidades" className="mt-2 text-sm font-medium text-error">
            {errors.modalidades.message}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="valor-hora" className="text-lg font-bold text-tinta">
          Valor da hora-aula
        </label>
        <div className="relative mt-2 max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-suave">R$</span>
          <input
            id="valor-hora"
            type="text"
            inputMode="decimal"
            placeholder="80,00"
            aria-invalid={errors.valorHora ? true : undefined}
            aria-describedby="dica-valor"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-base tabular-nums text-tinta placeholder:text-slate-400 focus:outline-none focus-visible:border-secondary focus-visible:ring-4 focus-visible:ring-secondary/30"
            {...register('valorHora')}
          />
        </div>
        <p id="dica-valor" className={`mt-1.5 text-sm ${errors.valorHora ? 'font-medium text-error' : 'text-suave'}`}>
          {errors.valorHora?.message ?? 'Valor de uma aula de 1 hora. O pagamento é combinado diretamente com o aluno.'}
        </p>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="sm:max-w-xs">
          <BotaoEnviar enviando={isSubmitting} rotulo="Salvar perfil" rotuloEnviando="Salvando…" />
        </div>
      </div>
    </form>
  );
}
