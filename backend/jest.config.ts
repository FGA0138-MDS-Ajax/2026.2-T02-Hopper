import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/tests/helpers/ambiente.ts'],
      globalSetup: '<rootDir>/tests/helpers/preparar-banco.ts',
    },
  ],
  passWithNoTests: true,
  testTimeout: 30_000,
  collectCoverageFrom: ['src/modules/**/*.service.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {},
    'src/modules/**/*.service.ts': { statements: 70, branches: 70, functions: 70, lines: 70 },
  },
};

export default config;
