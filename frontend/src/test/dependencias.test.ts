import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Prazo de validade do "overrides" do package.json.
 *
 * O typescript-eslint (só usado no lint) depende de uma versão do minimatch com vulnerabilidade
 * (GHSA-g3hv-75wg-m249, corrigida no 11.0.1). Enquanto ele não publicar uma versão que já peça o
 * minimatch corrigido, o "overrides" força a versão segura. Este teste garante que:
 *   1. o remendo está funcionando (a versão instalada é a corrigida);
 *   2. o remendo ainda é necessário. Quando o typescript-eslint passar a pedir o minimatch
 *      corrigido, o teste falha avisando para remover o "overrides" do package.json.
 */

const VERSAO_CORRIGIDA = [11, 0, 1];
const PASTA_DO_PACOTE = join(process.cwd(), 'node_modules', '@typescript-eslint', 'typescript-estree');

function lerJson(caminho: string): { version: string; dependencies?: Record<string, string> } {
  return JSON.parse(readFileSync(caminho, 'utf8'));
}

/** "^10.2.2" → [10, 2, 2] (a menor versão que a faixa aceita). */
function menorVersao(faixa: string): number[] {
  return faixa
    .replace(/^[\^~>=\s]+/, '')
    .split('.')
    .map(Number);
}

function ehCorrigida(versao: number[]): boolean {
  for (let i = 0; i < VERSAO_CORRIGIDA.length; i += 1) {
    if (versao[i] !== VERSAO_CORRIGIDA[i]) return versao[i] > VERSAO_CORRIGIDA[i];
  }
  return true;
}

/** Onde o Node encontra o minimatch para o typescript-estree: dentro dele ou na raiz. */
function minimatchUsado(): string {
  const local = join(PASTA_DO_PACOTE, 'node_modules', 'minimatch', 'package.json');
  return existsSync(local) ? local : join(process.cwd(), 'node_modules', 'minimatch', 'package.json');
}

describe('overrides do minimatch (typescript-eslint)', () => {
  it('a versão instalada para o typescript-eslint é a corrigida', () => {
    const versao = lerJson(minimatchUsado()).version;
    expect(ehCorrigida(menorVersao(versao)), `minimatch ${versao} ainda é vulnerável`).toBe(true);
  });

  it('o remendo ainda é necessário (se falhar, remova "overrides" do package.json)', () => {
    const faixa = lerJson(join(PASTA_DO_PACOTE, 'package.json')).dependencies?.minimatch ?? '';
    expect(
      ehCorrigida(menorVersao(faixa)),
      `O typescript-eslint já pede "minimatch": "${faixa}". Remova o bloco "overrides" do package.json e rode npm install.`,
    ).toBe(false);
  });
});
