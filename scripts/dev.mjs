#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const backendEnv = existsSync(join(RAIZ, 'backend', '.env'));

console.log('\x1b[36m%s\x1b[0m', '🚀 Iniciando AulaCerta em modo de desenvolvimento...');

const processos = [];

// Inicia o frontend
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const front = spawn(npmCmd, ['run', 'dev'], {
  cwd: join(RAIZ, 'frontend'),
  stdio: 'inherit',
});
processos.push(front);

// Se houver configuração de backend local, sobe o backend também
if (backendEnv) {
  console.log('\x1b[32m%s\x1b[0m', '📦 backend/.env encontrado: iniciando API local...');
  const back = spawn(npmCmd, ['run', 'dev'], {
    cwd: join(RAIZ, 'backend'),
    stdio: 'inherit',
  });
  processos.push(back);
} else {
  console.log('\x1b[33m%s\x1b[0m', 'ℹ️  backend/.env não encontrado. Subindo o front-end com a API de homologação do Render.');
  acordarApi();
}

async function acordarApi() {
  try {
    const inicio = Date.now();
    const res = await fetch('https://aulacerta-api.onrender.com/api/v1/saude', { signal: AbortSignal.timeout(65000) });
    if (res.ok) {
      const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
      if (segundos > 3) {
        console.log('\x1b[32m%s\x1b[0m', `☕ API em nuvem acordada com sucesso em ${segundos}s. Pronta para uso!`);
      } else {
        console.log('\x1b[32m%s\x1b[0m', '⚡ API em nuvem já está ativa e respondendo.');
      }
    }
  } catch {
    // Ignora erros de rede silenciosamente
  }
}

function finalizar() {
  console.log('\nEncerrando serviços...');
  for (const proc of processos) {
    if (!proc.killed) {
      proc.kill('SIGINT');
    }
  }
  process.exit(0);
}

process.on('SIGINT', finalizar);
process.on('SIGTERM', finalizar);
