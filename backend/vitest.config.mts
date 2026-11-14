import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // describe, it, expect e vi sem import, como no Jest.
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'tests/ferramentas/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          setupFiles: ['tests/helpers/ambiente.ts'],
          // Zera o banco de teste e aplica as migrações uma vez, antes de tudo.
          globalSetup: ['tests/helpers/preparar-banco.ts'],
          // Os testes de integração dividem o mesmo banco: um arquivo por vez.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      // Meta M6 do Documento de Visão: cobertura das regras de negócio (serviços) de pelo menos 70%.
      include: ['src/modules/**/*.service.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
    },
  },
});
