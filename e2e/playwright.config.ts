import { defineConfig, devices } from '@playwright/test';
import { config as carregarEnv } from 'dotenv';
import { join } from 'node:path';
import { PORTA_API, PORTA_SITE, URL_API, URL_SITE } from './apoio/ambiente';

/** "2026-11-14_14-30-05" no horário de Brasília (o mesmo formato do scripts/registrar-testes.mjs). */
function carimboEmBrasilia(): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(new Date())
      .map((parte) => [parte.type, parte.value]),
  );
  return `${p.year}-${p.month}-${p.day}_${p.hour}-${p.minute}-${p.second}`;
}

/**
 * Testes de sistema (ponta a ponta) do AulaCerta: o Playwright sobe a API e o site em portas
 * próprias, apontando para o BANCO DE TESTE (DATABASE_URL_TESTE do backend/.env), e usa a
 * aplicação como aluno e como professor.
 */

// DATABASE_URL_TESTE e as demais variáveis vêm do backend/.env.
carregarEnv({ path: join(__dirname, '..', 'backend', '.env'), quiet: true });

const BANCO_DE_TESTE = process.env.DATABASE_URL_TESTE;
if (!BANCO_DE_TESTE) {
  throw new Error('Defina DATABASE_URL_TESTE no backend/.env (banco separado, só para testes).');
}

// Cada execução guarda o relatório numa pasta própria, com data e hora (fora do Git).
// O Playwright relê este arquivo em cada processo de teste: a data e hora é calculada uma vez só
// e passada aos demais pela variável de ambiente, para tudo da execução cair na mesma pasta.
// Quando vem do scripts/registrar-testes.mjs, o carimbo já chega pronto (mesma pasta do log).
process.env.CARIMBO_DA_EXECUCAO ??= carimboEmBrasilia();
const carimbo = process.env.CARIMBO_DA_EXECUCAO;
const PASTA_DA_EXECUCAO = join(__dirname, '..', 'relatorios', 'e2e', carimbo);

export default defineConfig({
  testDir: './testes',
  globalSetup: './apoio/preparar-banco.ts',
  // Os testes dividem o mesmo banco; um por vez deixa os resultados previsíveis.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: join(PASTA_DA_EXECUCAO, 'artefatos'),
  reporter: [['list'], ['html', { outputFolder: join(PASTA_DA_EXECUCAO, 'html'), open: 'never' }]],
  use: {
    baseURL: URL_SITE,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Evidência: captura de tela de todo teste; vídeo e trace (passo a passo) quando falhar.
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'API',
      command: 'npx tsx src/server.ts',
      cwd: join(__dirname, '..', 'backend'),
      url: `${URL_API}/saude`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'test',
        PORT: String(PORTA_API),
        DATABASE_URL: BANCO_DE_TESTE,
        JWT_SECRET: 'segredo-dos-testes-de-sistema-com-mais-de-32-caracteres',
        JWT_EXPIRES_IN: '2h',
        CORS_ORIGIN: URL_SITE,
        FRONTEND_URL: URL_SITE,
        // Nunca envia e-mail de verdade nos testes.
        BREVO_API_KEY: '',
      },
    },
    {
      name: 'Site',
      command: `npx vite --port ${PORTA_SITE} --strictPort`,
      cwd: join(__dirname, '..', 'frontend'),
      url: URL_SITE,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_API_URL: URL_API },
    },
  ],
});
