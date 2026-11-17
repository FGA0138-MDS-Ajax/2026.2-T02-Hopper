import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Regras recomendadas (Quadro 4 do Documento de Arquitetura). A formatação fica com o Prettier.
export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Regra do React Compiler, que o projeto não usa (o watch() do react-hook-form é legítimo aqui).
      'react-hooks/incompatible-library': 'off',
      // O contexto exporta o Provider e o hook useSessao juntos, o padrão do React.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true, allowExportNames: ['useSessao'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Testes e utilitários de teste podem exportar o que quiserem.
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettier,
);
