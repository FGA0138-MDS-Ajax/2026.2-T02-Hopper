import type { Page, TestInfo } from '@playwright/test';
import { URL_API } from './ambiente';

/**
 * Prepara dados pela API (rápido e sem depender da tela) para que cada teste use a interface só
 * no passo que ele verifica. Toda conta tem e-mail único, então os testes podem rodar de novo
 * sem limpar o banco.
 */

export const SENHA = 'Senha@12345';
const CHAVE_DO_TOKEN = 'aulacerta.token';

export interface Conta {
  nome: string;
  email: string;
  token: string;
  usuarioId: string;
}

export interface Professor extends Conta {
  /** Id do perfil de professor (o que aparece em /professores/:id). */
  professorId: string;
  materia: { id: string; nome: string; nivel: string };
}

export interface Horario {
  inicio: string;
  fim: string;
}

async function chamar<T>(metodo: string, caminho: string, corpo?: unknown, token?: string): Promise<T> {
  const resposta = await fetch(`${URL_API}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`${metodo} ${caminho} respondeu ${resposta.status}: ${texto}`);
  return (texto ? JSON.parse(texto) : undefined) as T;
}

let contador = 0;

/** E-mail que nunca se repete, nem entre execuções. */
export function emailUnico(prefixo: string): string {
  contador += 1;
  return `${prefixo}.${Date.now()}.${contador}@teste.aulacerta.com.br`;
}

export async function criarConta(perfil: 'ALUNO' | 'PROFESSOR', nome: string): Promise<Conta> {
  const email = emailUnico(perfil.toLowerCase());
  await chamar('POST', '/auth/cadastro', { nome, email, senha: SENHA, perfil, consentimentoLgpd: true });
  const { token, usuario } = await chamar<{ token: string; usuario: { id: string } }>('POST', '/auth/login', {
    email,
    senha: SENHA,
  });
  return { nome, email, token, usuarioId: usuario.id };
}

/**
 * Professor com perfil completo (uma matéria, aula online). Com grade, atende todos os dias das
 * 7h às 21h, o que garante horários livres nas próximas semanas.
 */
export async function criarProfessor(nome: string, { comGrade = true } = {}): Promise<Professor> {
  const conta = await criarConta('PROFESSOR', nome);
  const { itens: materias } = await chamar<{ itens: Professor['materia'][] }>('GET', '/materias');
  const materia = materias[0];
  await chamar(
    'PUT',
    '/professores/me',
    {
      apresentacao: 'Professor criado pelos testes de sistema.',
      valorHora: 80,
      modalidades: ['ONLINE'],
      materiaIds: [materia.id],
    },
    conta.token,
  );
  if (comGrade) {
    const faixas = [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({ diaSemana, horaInicio: '07:00', horaFim: '21:00' }));
    await chamar('PUT', '/professores/me/disponibilidade', { faixas }, conta.token);
  }
  const perfil = await chamar<{ id: string }>('GET', '/professores/me', undefined, conta.token);
  return { ...conta, professorId: perfil.id, materia };
}

export async function horariosLivres(professorId: string): Promise<Horario[]> {
  const professor = await chamar<{ horariosLivres: Horario[] }>('GET', `/professores/${professorId}`);
  return professor.horariosLivres;
}

/** Um horário livre com folga de algumas horas, para a aula não "passar" durante o teste. */
export async function horarioLivreComFolga(professorId: string): Promise<Horario> {
  const limite = Date.now() + 3 * 60 * 60 * 1000;
  const horario = (await horariosLivres(professorId)).find((livre) => new Date(livre.inicio).getTime() > limite);
  if (!horario) throw new Error('O professor de teste não tem horário livre.');
  return horario;
}

/** O aluno pede uma aula pela API; devolve o id da aula criada. */
export async function solicitarAula(aluno: Conta, professor: Professor, horario: Horario): Promise<string> {
  const { itens } = await chamar<{ itens: { id: string }[] }>(
    'POST',
    '/aulas',
    {
      professorId: professor.professorId,
      materiaId: professor.materia.id,
      modalidade: 'ONLINE',
      inicio: horario.inicio,
      fim: horario.fim,
      objetivo: 'Aula pedida pelos testes de sistema',
    },
    aluno.token,
  );
  return itens[0].id;
}

/** Abre o site já logado com a conta (o login em si é testado em outro caso). */
export async function entrarComo(page: Page, conta: Conta): Promise<void> {
  await page.addInitScript(
    ([chave, token]) => {
      window.localStorage.setItem(chave, token);
    },
    [CHAVE_DO_TOKEN, conta.token] as const,
  );
}

/** Anexa ao relatório uma captura da tela inteira, como evidência do passo. */
export async function capturar(page: Page, testInfo: TestInfo, nome: string): Promise<void> {
  await testInfo.attach(nome, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
}
