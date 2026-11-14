#!/usr/bin/env node
/**
 * Roda um tipo de teste e registra a execução em relatorios/<tipo>/<data-hora>/:
 *   - execucao.log     saída do terminal, sem códigos de cor, com cabeçalho e rodapé
 *   - resumo.json      situação, totais, cobertura, duração, branch e commit
 *   - html/index.html  relatório visual dos testes (Vitest ou Playwright)
 *   - cobertura/       relatório de cobertura com o código linha a linha, quando o tipo mede cobertura
 * Depois refaz relatorios/index.html, com todas as execuções.
 * Os relatórios do Vitest e a cobertura seguem o visual do front-end do AulaCerta.
 *
 * Uso (a partir da raiz do repositório):
 *   node scripts/registrar-testes.mjs <tipo>     tipos: backend-unitarios, backend-integracao, frontend, e2e
 *   node scripts/registrar-testes.mjs todos      roda os quatro, em sequência
 *   node scripts/registrar-testes.mjs indice     só refaz o relatorios/index.html
 *
 * Sem dependências: só Node (20 ou mais novo).
 */
import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// No Windows, a letra da unidade vai sempre maiúscula: o terminal do VS Code costuma abrir em "c:\...",
// e o Vite trata "c:\" e "C:\" como arquivos diferentes, carregando o vitest duas vezes
// ("Vitest failed to find the current suite").
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..').replace(/^[a-z]:/, (unidade) => unidade.toUpperCase());
const PASTA_RELATORIOS = join(RAIZ, 'relatorios');
const FUSO = 'America/Sao_Paulo';

/** Caminho do executável de cada ferramenta, chamado direto pelo Node (sem shell). */
const VITEST = (pasta) => join(RAIZ, pasta, 'node_modules', 'vitest', 'vitest.mjs');
const PLAYWRIGHT = join(RAIZ, 'e2e', 'node_modules', '@playwright', 'test', 'cli.js');

/** Argumentos comuns do Vitest: resultado em JSON (com a linha de cada teste) para montar o HTML. */
const VITEST_JSON = (saida) => [
  '--reporter=default',
  '--reporter=json',
  `--outputFile.json=${saida}/resultado.json`,
  '--includeTaskLocation',
];
const VITEST_COBERTURA = (saida) => [
  '--coverage',
  `--coverage.reportsDirectory=${saida}/cobertura`,
  '--coverage.reporter=text',
  '--coverage.reporter=html',
  '--coverage.reporter=json-summary',
];

/**
 * Cada tipo diz onde roda e quais argumentos usa. Os caminhos de saída são relativos à pasta
 * onde o teste roda (cwd), apontando para a pasta desta execução.
 */
const TIPOS = {
  'backend-unitarios': {
    titulo: 'Back-end — testes unitários (com cobertura)',
    curto: 'Back-end · unitários',
    pasta: 'backend',
    ferramenta: 'vitest',
    argumentos: (saida) => ['run', '--project', 'unit', ...VITEST_JSON(saida), ...VITEST_COBERTURA(saida)],
  },
  'backend-integracao': {
    titulo: 'Back-end — testes de integração (banco de teste)',
    curto: 'Back-end · integração',
    pasta: 'backend',
    ferramenta: 'vitest',
    argumentos: (saida) => ['run', '--project', 'integration', ...VITEST_JSON(saida)],
  },
  frontend: {
    titulo: 'Front-end — testes de componentes (com cobertura)',
    curto: 'Front-end · componentes',
    pasta: 'frontend',
    ferramenta: 'vitest',
    argumentos: (saida) => ['run', ...VITEST_JSON(saida), ...VITEST_COBERTURA(saida)],
  },
  e2e: {
    titulo: 'Sistema — Playwright (ponta a ponta)',
    curto: 'Sistema · Playwright',
    pasta: 'e2e',
    ferramenta: 'playwright',
    // O playwright.config.ts já grava html/ e artefatos/ na pasta da execução (CARIMBO_DA_EXECUCAO).
    argumentos: () => ['test'],
  },
};

// ------------------------------------------------------------------ utilidades

function emBrasilia(data = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: FUSO,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(data)
      .map((p) => [p.type, p.value]),
  );
  return {
    carimbo: `${partes.year}-${partes.month}-${partes.day}_${partes.hour}-${partes.minute}-${partes.second}`,
    legivel: `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}:${partes.second}`,
  };
}

function git(...args) {
  const r = spawnSync('git', args, { cwd: RAIZ, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : 'desconhecido';
}

const semCores = (texto) => texto.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
const barras = (caminho) => caminho.split('\\').join('/');
const escapar = (t) =>
  String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const numero = (v, casas = 1) => Number(v ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: casas });
const porcento = (v) => `${numero(v)}%`;
const segundos = (v) => `${numero(v)} s`;
const ms = (v) => `${Math.round(v ?? 0).toLocaleString('pt-BR')} ms`;

/** Totais lidos da saída: "Tests 133 passed (133)" (Vitest) ou "9 passed" (Playwright). */
function lerTotais(saida, ferramenta) {
  if (ferramenta === 'vitest') {
    const linha = saida.match(/^\s*Tests\s+(.+?)\s*\((\d+)\)\s*$/m);
    if (!linha) return null;
    const contar = (rotulo) => Number(linha[1].match(new RegExp(`(\\d+) ${rotulo}`))?.[1] ?? 0);
    return {
      total: Number(linha[2]),
      aprovados: contar('passed'),
      falharam: contar('failed'),
      ignorados: contar('skipped'),
    };
  }
  const contar = (rotulo) => Number(saida.match(new RegExp(`^\\s*(\\d+) ${rotulo}`, 'm'))?.[1] ?? 0);
  const totais = {
    aprovados: contar('passed'),
    falharam: contar('failed'),
    instaveis: contar('flaky'),
    ignorados: contar('skipped'),
  };
  const total = totais.aprovados + totais.falharam + totais.instaveis + totais.ignorados;
  return total > 0 ? { total, ...totais } : null;
}

function descreverTotais(t) {
  if (!t) return 'não foi possível ler os totais (veja o log)';
  const partes = [`${t.aprovados} aprovados`];
  if (t.falharam) partes.push(`${t.falharam} falharam`);
  if (t.instaveis) partes.push(`${t.instaveis} instáveis`);
  if (t.ignorados) partes.push(`${t.ignorados} ignorados`);
  return `${partes.join(', ')} (de ${t.total})`;
}

// ------------------------------------------------------------------ execução

async function executar(nomeDoTipo) {
  const tipo = TIPOS[nomeDoTipo];
  const { carimbo, legivel } = emBrasilia();
  const pastaDaExecucao = join(PASTA_RELATORIOS, nomeDoTipo, carimbo);
  mkdirSync(pastaDaExecucao, { recursive: true });
  const cwd = join(RAIZ, tipo.pasta);
  const saidaRelativa = barras(relative(cwd, pastaDaExecucao));
  const executavel = tipo.ferramenta === 'vitest' ? VITEST(tipo.pasta) : PLAYWRIGHT;
  if (!existsSync(executavel)) {
    console.error(`Dependências não instaladas em ${tipo.pasta}/: rode "npm install" nessa pasta.`);
    return { tipo: nomeDoTipo, situacao: 'ERRO', codigo: 1 };
  }
  const argumentos = tipo.argumentos(saidaRelativa);
  const ambiente = { ...process.env, CARIMBO_DA_EXECUCAO: carimbo, FORCE_COLOR: '0' };
  // Node 25+ tem um localStorage próprio que atrapalha o jsdom dos testes do front-end.
  if (Number(process.versions.node.split('.')[0]) >= 25) {
    ambiente.NODE_OPTIONS = `${ambiente.NODE_OPTIONS ?? ''} --no-experimental-webstorage`.trim();
  }

  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  const commit = git('rev-parse', '--short', 'HEAD');
  const alterado = git('status', '--porcelain') !== '';
  const comando = `${tipo.ferramenta} ${argumentos.join(' ')}`;
  const log = createWriteStream(join(pastaDaExecucao, 'execucao.log'), { encoding: 'utf8' });
  const separador = '-'.repeat(78);
  log.write(
    [
      'AulaCerta — registro de execução de testes',
      separador,
      `Tipo:      ${tipo.titulo}`,
      `Início:    ${legivel} (horário de Brasília)`,
      `Branch:    ${branch} | commit ${commit}${alterado ? ' (com alterações não commitadas)' : ''}`,
      `Node:      ${process.version}`,
      `Pasta:     ${tipo.pasta}/`,
      `Comando:   ${comando}`,
      separador,
      '',
    ].join('\n'),
  );

  console.log(`\n=== ${tipo.titulo} ===`);
  const inicio = Date.now();
  let saida = '';
  const codigo = await new Promise((resolver) => {
    const filho = spawn(process.execPath, [executavel, ...argumentos], { cwd, env: ambiente });
    const repassar = (destino) => (pedaco) => {
      const texto = pedaco.toString();
      destino.write(texto);
      const limpo = semCores(texto);
      saida += limpo;
      log.write(limpo);
    };
    filho.stdout.on('data', repassar(process.stdout));
    filho.stderr.on('data', repassar(process.stderr));
    filho.on('close', (c) => resolver(c ?? 1));
    filho.on('error', (erro) => {
      log.write(`\nErro ao iniciar: ${erro.message}\n`);
      resolver(1);
    });
  });
  const duracao = (Date.now() - inicio) / 1000;

  // Vitest: totais e relatório HTML vêm do resultado.json (mais confiável que ler o terminal).
  const resultadoDoVitest = tipo.ferramenta === 'vitest' ? lerResultadoDoVitest(pastaDaExecucao) : null;
  const totais = resultadoDoVitest ? totaisDoVitest(resultadoDoVitest) : lerTotais(saida, tipo.ferramenta);
  const situacao = codigo === 0 ? 'APROVADO' : 'REPROVADO';
  const cobertura = lerCobertura(pastaDaExecucao);
  vestirCobertura(pastaDaExecucao);
  if (resultadoDoVitest) {
    gerarHtmlDoVitest(pastaDaExecucao, resultadoDoVitest, cobertura, {
      titulo: tipo.titulo,
      pasta: tipo.pasta,
      situacao,
      totais,
      inicio: legivel,
      duracao,
      branch,
      commit,
      alterado,
    });
  }
  const relatorios = ['html/index.html', 'cobertura/index.html'].filter((r) => existsSync(join(pastaDaExecucao, r)));

  log.write(
    [
      '',
      separador,
      `Resultado: ${situacao} (código de saída ${codigo})`,
      `Testes:    ${descreverTotais(totais)}`,
      ...(cobertura ? [`Cobertura: ${descreverCobertura(cobertura.total)}`] : []),
      `Duração:   ${segundos(duracao)}`,
      `Relatórios: ${relatorios.length ? relatorios.join(', ') : 'nenhum'}`,
      separador,
      '',
    ].join('\n'),
  );
  await new Promise((resolver) => log.end(resolver));

  const resumo = {
    tipo: nomeDoTipo,
    titulo: tipo.titulo,
    carimbo,
    inicio: legivel,
    duracao,
    situacao,
    codigo,
    totais,
    cobertura: cobertura ? percentuais(cobertura.total) : null,
    branch,
    commit,
    alterado,
    comando,
    relatorios,
  };
  writeFileSync(join(pastaDaExecucao, 'resumo.json'), `${JSON.stringify(resumo, null, 2)}\n`);
  console.log(`\n${situacao}: ${descreverTotais(totais)} — ${barras(relative(RAIZ, pastaDaExecucao))}/execucao.log`);
  return resumo;
}

// ------------------------------------------------------------------ leitura dos resultados

function lerJson(arquivo) {
  if (!existsSync(arquivo)) return null;
  try {
    return JSON.parse(readFileSync(arquivo, 'utf8'));
  } catch {
    return null;
  }
}

const lerResultadoDoVitest = (pastaDaExecucao) => lerJson(join(pastaDaExecucao, 'resultado.json'));

function totaisDoVitest(r) {
  return {
    total: r.numTotalTests,
    aprovados: r.numPassedTests,
    falharam: r.numFailedTests,
    ignorados: (r.numPendingTests ?? 0) + (r.numTodoTests ?? 0),
  };
}

const chaveDeCaminho = (caminho) => resolve(caminho).toLowerCase();

/** Lê cobertura/coverage-summary.json: o total e, por arquivo, o resumo e a página com o código. */
function lerCobertura(pastaDaExecucao) {
  const pasta = join(pastaDaExecucao, 'cobertura');
  const dados = lerJson(join(pasta, 'coverage-summary.json'));
  if (!dados?.total) return null;
  const porArquivo = new Map();
  for (const arquivo of Object.keys(dados).filter((k) => k !== 'total')) {
    // A página do código fica em cobertura/<caminho a partir da raiz que o Istanbul escolheu>.html.
    // A raiz muda conforme o projeto, então vale o maior final de caminho que existir.
    const partes = barras(resolve(arquivo)).split('/');
    let pagina = null;
    for (let i = 0; i < partes.length && !pagina; i++) {
      const candidata = `${partes.slice(i).join('/')}.html`;
      if (existsSync(join(pasta, candidata))) pagina = candidata;
    }
    porArquivo.set(chaveDeCaminho(arquivo), { resumo: dados[arquivo], pagina });
  }
  return { total: dados.total, porArquivo };
}

function percentuais(total) {
  return {
    linhas: total.lines.pct,
    instrucoes: total.statements.pct,
    funcoes: total.functions.pct,
    ramificacoes: total.branches.pct,
  };
}

function descreverCobertura(total) {
  const p = percentuais(total);
  return `linhas ${porcento(p.linhas)}, instruções ${porcento(p.instrucoes)}, funções ${porcento(p.funcoes)}, ramificações ${porcento(p.ramificacoes)}`;
}

/** Cobertura de uma execução antiga, quando o resumo.json não traz o campo. */
function coberturaDoResumo(e) {
  if (e.cobertura) return e.cobertura;
  const dados = lerJson(join(PASTA_RELATORIOS, e.tipo, e.carimbo, 'cobertura', 'coverage-summary.json'));
  return dados?.total ? percentuais(dados.total) : null;
}

// ------------------------------------------------------------------ visual do AulaCerta (partes comuns)

/** Mesma marca do front-end (frontend/src/components/logo.tsx). */
function logo(clara = false) {
  const livro = clara ? '#ffffff' : '#1b3a64';
  return `<svg viewBox="0 0 64 44" class="logo" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9v29c9-1.5 17 .5 23 5V13C22 8.5 13.5 7 5 9Z" stroke="${livro}" stroke-width="3.4"/><path d="M10 16c4.5 0 8.5 1 12.5 3M10 22c4.5 0 8.5 1 12.5 3M10 28c4.5 0 8.5 1 12.5 3" stroke="${livro}" stroke-width="2.6"/><circle cx="42" cy="20" r="12.5" stroke="#1fc58e" stroke-width="3.4"/><path d="M42 13.5v7.5h5.5M39 4h6" stroke="#1fc58e" stroke-width="3.2"/><path d="M34 29l7 7 19-21" stroke="#24a8d8" stroke-width="5.2"/></svg>`;
}

const FONTES = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">`;

/** Tokens do frontend/tailwind.config.ts (cores, fonte, cartões e botões). */
const CSS_AULACERTA = `
  :root { color-scheme:light; --primary:#00236f; --secondary:#0051d5; --ceu:#24a8d8; --menta:#1fc58e; --menta-escuro:#047857; --menta-fundo:#e8faf3; --ambar:#f59e0b; --ambar-escuro:#b45309; --ambar-fundo:#fef6e4; --erro:#ba1a1a; --erro-fundo:#fdeceb; --surface:#f6f8fd; --tinta:#0f172a; --suave:#475569; --borda:#e2e8f0; --neutro:#94a3b8; }
  * { box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { margin:0; font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif; background:var(--surface); color:var(--tinta); line-height:1.5; -webkit-font-smoothing:antialiased; }
  a { color:var(--secondary); }
  code, pre { font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace; }
  :focus-visible { outline:none; box-shadow:0 0 0 3px rgba(0,81,213,.3); border-radius:4px; }
  .conteudo { width:100%; max-width:72rem; margin:0 auto; padding:0 16px; }
  @media (min-width:640px) { .conteudo { padding:0 24px; } }
  .topo { position:sticky; top:0; z-index:20; background:rgba(246,248,253,.85); backdrop-filter:blur(8px); border-bottom:1px solid rgba(226,232,240,.6); }
  .topo .conteudo { display:flex; align-items:center; justify-content:space-between; gap:8px 24px; min-height:64px; flex-wrap:wrap; padding-top:8px; padding-bottom:8px; }
  .marca { display:inline-flex; align-items:center; gap:10px; text-decoration:none; }
  .marca .logo { height:32px; width:auto; flex-shrink:0; }
  .marca .nome { font-size:1.25rem; font-weight:800; letter-spacing:-.025em; color:var(--primary); }
  .marca .nome b { color:var(--secondary); font-weight:800; }
  .marca small { font-size:.75rem; font-weight:600; color:var(--suave); border-left:1px solid var(--borda); padding-left:10px; }
  .topo nav { display:flex; gap:6px 20px; flex-wrap:wrap; }
  .topo nav a { font-size:.875rem; font-weight:600; color:var(--suave); text-decoration:none; }
  .topo nav a:hover { color:var(--primary); }
  .painel { position:relative; overflow:hidden; margin:24px 0; padding:24px; border-radius:8px; color:#fff; background:var(--primary); }
  .painel h1 { font-size:1.75rem; font-weight:800; letter-spacing:-.025em; line-height:1.2; margin:6px 0 10px; }
  .painel p { color:#cbd5e1; margin:12px 0 0; max-width:46rem; }
  .painel .meta { display:flex; flex-wrap:wrap; gap:4px 20px; margin-top:16px; font-size:.85rem; color:#cbd5e1; }
  .painel .meta code { color:#fff; font-size:.8rem; }
  .numeros { display:flex; flex-wrap:wrap; gap:12px 36px; margin:18px 0 14px; }
  .numero strong { display:block; font-size:2rem; font-weight:800; line-height:1.1; }
  .numero span { font-size:.8rem; color:#cbd5e1; }
  .numero.ok strong { color:var(--menta); }
  .numero.falha strong { color:#ff8a80; }
  .barra { display:flex; height:8px; border-radius:2px; overflow:hidden; background:var(--borda); }
  .barra i { display:block; height:100%; }
  .barra .ok, .barra .alta { background:var(--menta); }
  .barra .falhou, .barra .baixa { background:var(--erro); }
  .barra .media { background:var(--ambar); }
  .barra .ignorado { background:var(--neutro); }
  .painel .barra { height:12px; background:rgba(255,255,255,.15); }
  .selo { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:4px; font-weight:600; font-size:.8rem; background:var(--menta-fundo); color:var(--menta-escuro); white-space:nowrap; }
  .selo.falha { background:var(--erro-fundo); color:var(--erro); }
  .cartao { background:#fff; border:1px solid var(--borda); border-radius:8px; }
  h2 { font-size:1.15rem; font-weight:800; letter-spacing:-.01em; color:var(--primary); margin:36px 0 4px; }
  .botao { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 16px; border-radius:6px; font:inherit; font-weight:600; font-size:.875rem; text-decoration:none; border:1px solid transparent; cursor:pointer; transition:background-color .15s, border-color .15s, color .15s; }
  .botao.principal { background:var(--secondary); color:#fff; }
  .botao.principal:hover { background:var(--primary); }
  .botao.secundario { background:#fff; color:var(--primary); border-color:#cbd5e1; }
  .botao.secundario:hover { border-color:var(--secondary); color:var(--secondary); }
  .painel .botao.secundario { background:rgba(255,255,255,.08); color:#fff; border-color:rgba(255,255,255,.3); }
  .painel .botao.secundario:hover { background:rgba(255,255,255,.16); }
  .botao.pequeno { height:32px; padding:0 12px; font-size:.8rem; border-radius:6px; }
  .acoes { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }
  .metricas { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; }
  .metrica { display:block; padding:16px; text-decoration:none; color:inherit; }
  a.metrica:hover { border-color:var(--secondary); }
  .metrica .rotulo { font-size:.8rem; font-weight:700; color:var(--suave); }
  .metrica strong { display:block; font-size:1.6rem; font-weight:800; margin:2px 0 8px; }
  .metrica small { display:block; margin-top:6px; font-size:.75rem; color:var(--suave); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior:auto; } * { transition:none !important; } }
`;

function topo(inicioDoCaminho, links) {
  return `<header class="topo"><div class="conteudo">
  <a class="marca" href="${inicioDoCaminho}index.html" aria-label="Todas as execuções">${logo()}<span class="nome">Aula<b>Certa</b></span><small>Relatórios de testes</small></a>
  <nav aria-label="Navegação dos relatórios">${links.map(([href, rotulo]) => `<a href="${escapar(href)}">${rotulo}</a>`).join('')}</nav>
</div></header>`;
}

/** Faixa colorida com a proporção de aprovados, falhas e ignorados. */
function barraDeTestes(t, classe = '') {
  if (!t?.total) return `<div class="barra ${classe}"></div>`;
  const p = (v) => ((100 * (v ?? 0)) / t.total).toFixed(2);
  return `<div class="barra ${classe}" role="img" aria-label="${escapar(descreverTotais(t))}"><i class="ok" style="width:${p(
    t.aprovados,
  )}%"></i><i class="falhou" style="width:${p(t.falharam)}%"></i><i class="ignorado" style="width:${p(
    (t.ignorados ?? 0) + (t.instaveis ?? 0),
  )}%"></i></div>`;
}

/** Mesmos limites do relatório de cobertura (Istanbul): 80% ou mais é alta; abaixo de 50%, baixa. */
const nivel = (pct) => (pct >= 80 ? 'alta' : pct >= 50 ? 'media' : 'baixa');
const barraDePercentual = (pct, classe = '') =>
  `<div class="barra ${classe}" role="img" aria-label="${porcento(pct)}"><i class="${nivel(pct)}" style="width:${Math.min(
    100,
    Math.max(0, pct),
  )}%"></i></div>`;

// ------------------------------------------------------------------ relatório HTML do Vitest

const ROTULO_DO_STATUS = {
  passed: 'aprovado',
  failed: 'falhou',
  skipped: 'ignorado',
  pending: 'ignorado',
  todo: 'a fazer',
};
const ICONE_DO_STATUS = { passed: '✓', failed: '✕', skipped: '–', pending: '–', todo: '–' };

const PALAVRAS = new Set(
  (
    'import export from const let var function return async await if else for of in new class extends ' +
    'interface type typeof keyof as throw try catch finally switch case break continue while do void delete ' +
    'true false null undefined this default satisfies readonly private public'
  ).split(' '),
);
const FUNCOES_DE_TESTE = new Set(
  'describe it test expect vi beforeEach afterEach beforeAll afterAll waitFor screen render within'.split(' '),
);

/** Destaque de sintaxe simples, linha a linha (comentários, textos, palavras-chave e funções de teste). */
function colorir(linha) {
  const padrao = /(\/\/.*$)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`?)|(?<![\w$])([A-Za-z_$][\w$]*)/g;
  let saida = '';
  let posicao = 0;
  for (const m of linha.matchAll(padrao)) {
    saida += escapar(linha.slice(posicao, m.index));
    if (m[1]) saida += `<span class="c">${escapar(m[1])}</span>`;
    else if (m[2]) saida += `<span class="s">${escapar(m[2])}</span>`;
    else if (PALAVRAS.has(m[3])) saida += `<span class="k">${m[3]}</span>`;
    else if (FUNCOES_DE_TESTE.has(m[3])) saida += `<span class="f">${m[3]}</span>`;
    else saida += escapar(m[3]);
    posicao = m.index + m[0].length;
  }
  return saida + escapar(linha.slice(posicao));
}

function codigoDoTeste(caminho, id, linhasDeTeste) {
  if (!existsSync(caminho)) return '';
  const linhas = readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  const corpo = linhas
    .map(
      (linha, i) =>
        `<span class="l${linhasDeTeste.has(i + 1) ? ' teste' : ''}" id="${id}-L${i + 1}"><span class="n">${
          i + 1
        }</span><span class="t">${colorir(linha) || ' '}</span></span>`,
    )
    .join('');
  return `<details class="codigo"><summary>Código do teste <span>(${linhas.length} linhas)</span></summary><pre class="fonte">${corpo}</pre></details>`;
}

/**
 * Relatório HTML autocontido (abre com dois cliques, sem servidor), no visual do front-end:
 * painel com a barra de testes, cobertura com barras e, por arquivo, cada teste com situação,
 * tempo, erro (quando falha), o código do teste e o link para o código coberto linha a linha.
 */
function gerarHtmlDoVitest(pastaDaExecucao, resultado, cobertura, dados) {
  const arquivos = [...resultado.testResults].sort((a, b) => a.name.localeCompare(b.name));
  const temCobertura = existsSync(join(pastaDaExecucao, 'cobertura', 'index.html'));

  const blocos = arquivos
    .map((arquivo, indice) => {
      const id = `a${indice}`;
      const caminho = barras(relative(RAIZ, arquivo.name));
      const [pasta, nome] = [
        caminho.slice(0, caminho.lastIndexOf('/') + 1),
        caminho.slice(caminho.lastIndexOf('/') + 1),
      ];
      const testes = arquivo.assertionResults;
      const contagem = (s) => testes.filter((t) => t.status === s).length;
      const totais = {
        total: testes.length,
        aprovados: contagem('passed'),
        falharam: contagem('failed'),
        ignorados: testes.length - contagem('passed') - contagem('failed'),
      };
      const status = totais.falharam > 0 || arquivo.status === 'failed' ? 'failed' : 'passed';
      const erroDoArquivo =
        arquivo.message && testes.length === 0 ? `<pre class="erro">${escapar(semCores(arquivo.message))}</pre>` : '';
      const linhasDeTeste = new Set(testes.map((t) => t.location?.line).filter(Boolean));

      const itens = testes
        .map((teste) => {
          const grupo = teste.ancestorTitles.length
            ? `<span class="grupo">${teste.ancestorTitles.map(escapar).join(' › ')} › </span>`
            : '';
          const mensagens = teste.failureMessages.length
            ? `<pre class="erro">${escapar(semCores(teste.failureMessages.join('\n\n')))}</pre>`
            : '';
          const linha = teste.location?.line
            ? `<button type="button" class="ir-linha" data-alvo="${id}-L${teste.location.line}" title="Mostrar no código do teste">linha ${teste.location.line}</button>`
            : '';
          const busca = [...teste.ancestorTitles, teste.title].join(' ').toLowerCase();
          return `<li class="${teste.status}" data-busca="${escapar(busca)}"><span class="icone" title="${
            ROTULO_DO_STATUS[teste.status] ?? teste.status
          }">${ICONE_DO_STATUS[teste.status] ?? '•'}</span><span class="nome">${grupo}${escapar(
            teste.title,
          )}</span><span class="lado-teste">${linha}<span>${ms(teste.duration)}</span></span>${mensagens}</li>`;
        })
        .join('\n');

      // Arquivo testado: o mesmo caminho sem ".test" (ex.: agenda.service.test.ts → agenda.service.ts).
      const alvo = cobertura?.porArquivo.get(chaveDeCaminho(arquivo.name.replace(/\.test(\.[cm]?[tj]sx?)$/, '$1')));
      const coberturaDoArquivo = alvo
        ? `<span class="cobertura-do-arquivo">Código testado: ${barraDePercentual(alvo.resumo.lines.pct)} ${porcento(
            alvo.resumo.lines.pct,
          )} das linhas</span>${
            alvo.pagina
              ? `<a class="botao secundario pequeno" href="../cobertura/${escapar(alvo.pagina)}">Ver código coberto, linha a linha →</a>`
              : ''
          }`
        : '';

      return `<details class="arquivo cartao ${status}" id="${id}" data-busca="${escapar(caminho.toLowerCase())}"${
        status === 'failed' ? ' open' : ''
      }>
  <summary><span class="icone">${ICONE_DO_STATUS[status]}</span><span class="caminho"><span class="pasta">${escapar(
    pasta,
  )}</span>${escapar(nome)}</span><span class="lado">${barraDeTestes(totais)}<span>${testes.length} ${
    testes.length === 1 ? 'teste' : 'testes'
  }${totais.falharam ? `, ${totais.falharam} falharam` : ''}</span><span>${ms(
    arquivo.endTime - arquivo.startTime,
  )}</span></span></summary>
  ${erroDoArquivo}<ul class="testes">${itens}</ul>
  ${coberturaDoArquivo ? `<div class="extras">${coberturaDoArquivo}</div>` : ''}
  ${codigoDoTeste(arquivo.name, id, linhasDeTeste)}
</details>`;
    })
    .join('\n');

  const secaoDeCobertura = cobertura
    ? `<h2>Cobertura do código</h2>
  <div class="metricas">${[
    ['Linhas', cobertura.total.lines],
    ['Instruções', cobertura.total.statements],
    ['Funções', cobertura.total.functions],
    ['Ramificações (if/else)', cobertura.total.branches],
  ]
    .map(
      ([rotulo, m]) =>
        `<a class="metrica cartao" href="../cobertura/index.html"><span class="rotulo">${rotulo}</span><strong>${porcento(
          m.pct,
        )}</strong>${barraDePercentual(m.pct)}<small>${m.covered} de ${m.total} cobertas</small></a>`,
    )
    .join('')}</div>`
    : '';

  const aprovado = dados.situacao === 'APROVADO';
  const t = dados.totais ?? { total: 0, aprovados: 0, falharam: 0, ignorados: 0 };
  const links = [
    ['../../../index.html', 'Todas as execuções'],
    ['../execucao.log', 'Log completo'],
    ...(temCobertura ? [['../cobertura/index.html', 'Cobertura']] : []),
  ];

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(dados.titulo)} — ${escapar(dados.inicio)}</title>
${FONTES}
<style>${CSS_AULACERTA}
  .ferramentas { position:sticky; top:65px; z-index:10; display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; padding:10px 0; background:var(--surface); }
  @media (max-width:640px) { .ferramentas { position:static; } }
  .busca { flex:1 1 240px; height:40px; border:1px solid #cbd5e1; border-radius:6px; padding:0 14px; font:inherit; font-size:.875rem; background:#fff; color:var(--tinta); }
  .busca:focus { border-color:var(--secondary); }
  .opcao { display:inline-flex; gap:8px; align-items:center; font-size:.875rem; font-weight:600; color:var(--suave); cursor:pointer; }
  .opcao input { accent-color:var(--secondary); width:16px; height:16px; }
  details.arquivo { margin:10px 0; overflow:hidden; }
  details.arquivo > summary { list-style:none; cursor:pointer; padding:14px 16px; display:grid; grid-template-columns:24px 1fr auto; gap:4px 12px; align-items:center; }
  details.arquivo > summary::-webkit-details-marker { display:none; }
  details.arquivo > summary:hover { background:#f8fafc; }
  details.arquivo[open] > summary { border-bottom:1px solid var(--borda); }
  details.arquivo.failed { border-color:#f5c2c0; }
  details.arquivo.failed > summary { background:var(--erro-fundo); }
  .caminho { font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace; font-size:.85rem; font-weight:700; word-break:break-all; }
  .caminho .pasta { color:var(--suave); font-weight:400; }
  .lado { display:flex; align-items:center; gap:12px; font-size:.8rem; color:var(--suave); white-space:nowrap; }
  .lado .barra { width:96px; height:8px; }
  @media (max-width:640px) { details.arquivo > summary { grid-template-columns:24px 1fr; } .lado { grid-column:2; flex-wrap:wrap; } }
  .icone { display:inline-grid; place-items:center; width:20px; height:20px; border-radius:4px; font-size:.75rem; font-weight:800; background:var(--menta-fundo); color:var(--menta-escuro); }
  .failed > .icone, details.failed > summary .icone { background:var(--erro); color:#fff; }
  .skipped > .icone, .pending > .icone, .todo > .icone { background:#f1f5f9; color:var(--suave); }
  .testes { list-style:none; margin:0; padding:4px 16px; }
  .testes li { display:grid; grid-template-columns:22px 1fr auto; gap:4px 12px; padding:9px 0; border-top:1px solid #f1f5f9; font-size:.875rem; align-items:start; }
  .testes li:first-child { border-top:none; }
  .nome .grupo { color:var(--suave); }
  .lado-teste { display:flex; gap:10px; align-items:center; font-size:.75rem; color:var(--suave); white-space:nowrap; }
  .ir-linha { font:inherit; font-size:.75rem; font-weight:700; color:var(--secondary); background:#eef3fd; border:0; border-radius:4px; padding:2px 8px; cursor:pointer; }
  .ir-linha:hover { background:#dce7fb; }
  pre.erro { grid-column:2 / -1; margin:6px 0 0; padding:12px; background:var(--erro-fundo); color:var(--erro); border-radius:6px; overflow-x:auto; font-size:.75rem; white-space:pre-wrap; }
  details.arquivo > pre.erro { margin:12px 16px; }
  .extras { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; padding:8px 16px 4px; border-top:1px solid #f1f5f9; }
  .cobertura-do-arquivo { display:inline-flex; gap:8px; align-items:center; font-size:.8rem; color:var(--suave); }
  .cobertura-do-arquivo .barra { width:80px; height:8px; }
  details.codigo { margin:10px 16px 16px; border:1px solid var(--borda); border-radius:6px; overflow:hidden; }
  details.codigo > summary { cursor:pointer; padding:10px 14px; font-size:.85rem; font-weight:700; color:var(--primary); background:#f8fafc; }
  details.codigo > summary span { color:var(--suave); font-weight:500; }
  .fonte { margin:0; max-height:520px; overflow:auto; background:#fff; font-size:12.5px; line-height:1.6; tab-size:2; }
  .fonte .l { display:flex; min-width:max-content; }
  .fonte .n { position:sticky; left:0; flex:0 0 3.5em; padding-right:12px; text-align:right; color:var(--neutro); background:#f8fafc; border-right:1px solid var(--borda); user-select:none; }
  .fonte .t { padding:0 16px 0 12px; white-space:pre; flex:1; }
  .fonte .l.teste .n { color:var(--secondary); font-weight:700; background:#eef3fd; }
  .fonte .l.teste .t { background:#f5f8fe; }
  .fonte .l.alvo .t, .fonte .l.alvo .n { background:#fff4c2; }
  .fonte .k { color:#00236f; font-weight:700; }
  .fonte .f { color:#0051d5; font-weight:600; }
  .fonte .s { color:#047857; }
  .fonte .c { color:#64748b; font-style:italic; }
  .vazio { display:none; text-align:center; color:var(--suave); padding:24px; }
  body.so-falhas details.arquivo.passed, body.so-falhas .testes li.passed, .oculto { display:none !important; }
</style>
</head>
<body>
${topo('../../../', links)}
<main class="conteudo">
  <section class="painel">
    <h1>${escapar(dados.titulo)}</h1>
    <span class="selo ${aprovado ? '' : 'falha'}">${aprovado ? 'Aprovado' : 'Reprovado'}</span>
    <div class="numeros">
      <div class="numero ok"><strong>${t.aprovados}</strong><span>aprovados</span></div>
      <div class="numero ${t.falharam ? 'falha' : ''}"><strong>${t.falharam}</strong><span>falharam</span></div>
      ${t.ignorados ? `<div class="numero"><strong>${t.ignorados}</strong><span>ignorados</span></div>` : ''}
      <div class="numero"><strong>${t.total}</strong><span>testes</span></div>
      <div class="numero"><strong>${arquivos.length}</strong><span>arquivos de teste</span></div>
      <div class="numero"><strong>${segundos(dados.duracao)}</strong><span>duração</span></div>
    </div>
    ${barraDeTestes(dados.totais)}
    <div class="meta">
      <span>Início: ${escapar(dados.inicio)} (horário de Brasília)</span>
      <span>Branch <code>${escapar(dados.branch)}</code> · commit <code>${escapar(dados.commit)}</code>${
        dados.alterado ? ' (com alterações não commitadas)' : ''
      }</span>
      <span>Node ${escapar(process.version)}</span>
    </div>
    <div class="acoes">
      <a class="botao secundario" href="../execucao.log">Abrir o log completo</a>
      ${temCobertura ? '<a class="botao secundario" href="../cobertura/index.html">Ver a cobertura linha a linha</a>' : ''}
    </div>
  </section>
  ${secaoDeCobertura}
  <h2>Testes por arquivo</h2>
  <div class="ferramentas">
    <input id="busca" class="busca" type="search" placeholder="Buscar teste ou arquivo…" aria-label="Buscar teste ou arquivo">
    <label class="opcao"><input id="so-falhas" type="checkbox"> Só o que falhou</label>
    <button type="button" class="botao secundario pequeno" id="abrir">Abrir todos</button>
    <button type="button" class="botao secundario pequeno" id="fechar">Fechar todos</button>
  </div>
  ${blocos}
  <p class="vazio cartao" id="vazio">Nenhum teste encontrado.</p>
</main>
<script>
  const arquivos = [...document.querySelectorAll('details.arquivo')];
  const busca = document.getElementById('busca');
  busca.addEventListener('input', () => {
    const termo = busca.value.trim().toLowerCase();
    let visiveis = 0;
    for (const arquivo of arquivos) {
      const doArquivo = arquivo.dataset.busca.includes(termo);
      let algum = false;
      for (const item of arquivo.querySelectorAll('.testes li')) {
        const mostra = !termo || doArquivo || item.dataset.busca.includes(termo);
        item.classList.toggle('oculto', !mostra);
        algum = algum || mostra;
      }
      arquivo.classList.toggle('oculto', !algum);
      if (termo && algum) arquivo.open = true;
      if (algum) visiveis++;
    }
    document.getElementById('vazio').style.display = visiveis ? 'none' : 'block';
  });
  document.getElementById('so-falhas').addEventListener('change', (e) => document.body.classList.toggle('so-falhas', e.target.checked));
  document.getElementById('abrir').addEventListener('click', () => arquivos.forEach((a) => (a.open = true)));
  document.getElementById('fechar').addEventListener('click', () => arquivos.forEach((a) => (a.open = false)));
  document.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-alvo]');
    if (!botao) return;
    const linha = document.getElementById(botao.dataset.alvo);
    if (!linha) return;
    linha.closest('details.codigo').open = true;
    document.querySelectorAll('.l.alvo').forEach((l) => l.classList.remove('alvo'));
    linha.classList.add('alvo');
    linha.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
</script>
</body>
</html>
`;
  mkdirSync(join(pastaDaExecucao, 'html'), { recursive: true });
  writeFileSync(join(pastaDaExecucao, 'html', 'index.html'), html);
}

// ------------------------------------------------------------------ cobertura no visual do AulaCerta

/** Sobrescreve as variáveis de tema do Istanbul (base.css) com as cores e a fonte do front-end. */
const CSS_COBERTURA = `/* Visual do AulaCerta sobre o relatório de cobertura do Istanbul (gerado por scripts/registrar-testes.mjs). */
:root, :root[data-theme] {
  color-scheme: light;
  --color-text: #0f172a; --color-bg: #f6f8fd; --color-quiet: #475569; --color-link: #0051d5;
  --color-fraction: #00236f; --color-fraction-bg: #e8eefc; --color-border: #e2e8f0; --color-keyline: #e2e8f0;
  --color-high: #e8faf3; --color-high-strong: #1fc58e; --color-covered: rgba(31, 197, 142, .25);
  --color-medium: #fef6e4; --color-medium-strong: #f59e0b;
  --color-low: #fdeceb; --color-low-strong: #ba1a1a; --color-uncovered: rgba(186, 26, 26, .18);
  --color-highlighted: rgba(186, 26, 26, .5); --color-neutral: #f1f5f9; --color-cover-empty: #e2e8f0;
}
:root:not([data-theme="legacy"]) body { font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 14px; -webkit-font-smoothing: antialiased; }
.ac-topo { position: sticky; top: 0; z-index: 20; background: rgba(246, 248, 253, .9); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(226, 232, 240, .6); }
.ac-topo .ac-conteudo { max-width: 72rem; margin: 0 auto; padding: 8px 16px; min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 8px 24px; flex-wrap: wrap; }
.ac-marca { display: inline-flex; align-items: center; gap: 10px; text-decoration: none !important; }
.ac-marca .logo { height: 32px; width: auto; }
.ac-marca .nome { font-size: 1.25rem; font-weight: 800; letter-spacing: -.025em; color: #00236f; }
.ac-marca .nome b { color: #0051d5; }
.ac-marca small { font-size: .75rem; font-weight: 600; color: #475569; border-left: 1px solid #e2e8f0; padding-left: 10px; }
.ac-topo nav { display: flex; gap: 6px 20px; flex-wrap: wrap; }
.ac-topo nav a { font-size: .875rem; font-weight: 600; color: #475569; }
.ac-topo nav a:hover { color: #00236f; text-decoration: none; }
.wrapper { max-width: 72rem; padding: 0 16px; min-height: calc(100% - 65px); }
.wrapper > .pad1:first-child { padding: 24px 0 8px; }
.wrapper > .pad1:not(:first-child) { padding: 16px 0; }
:root:not([data-theme="legacy"]) h1 { font-size: 1.6rem; font-weight: 800; letter-spacing: -.02em; color: #00236f; margin: 0 0 12px; }
h1 a { color: #0051d5; }
.clearfix .fl.pad1y { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin: 0 10px 10px 0; }
.clearfix .strong { font-size: 1.1rem; font-weight: 800; }
:root:not([data-theme="legacy"]) pre, :root:not([data-theme="legacy"]) .fraction { font-family: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace; }
:root:not([data-theme="legacy"]) .fraction { border-radius: 4px; padding: 3px 8px; font-size: 11px; }
p.quiet { clear: both; font-size: .85rem; }
:root:not([data-theme="legacy"]) #fileSearch { height: 36px; min-width: 260px; border-radius: 6px; padding: 0 12px; border-color: #cbd5e1; }
.status-line { height: 6px; border-radius: 2px; }
:root:not([data-theme="legacy"]) .coverage-summary { width: 100%; border-radius: 8px; background: #fff; }
:root:not([data-theme="legacy"]) .coverage-summary th { background: #f8fafc; color: #0f172a; font-weight: 700; }
.coverage-summary td, .coverage-summary th { padding: 10px 12px; }
.coverage-summary td.file a { font-weight: 600; }
.coverage-summary td.pic { min-width: 130px; }
.wrapper > .pad1:not(:first-child) { overflow-x: auto; }
.chart, .high .chart, .medium .chart, .low .chart { display: flex; width: 110px; height: 8px; border: 0; border-radius: 2px; overflow: hidden; background: #e2e8f0; }
.cover-fill, .cover-empty { height: 8px; }
.cover-empty { background: transparent; }
pre:has(> table.coverage) { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 0; overflow-x: auto; margin-top: 8px; }
table.coverage { margin: 0; }
table.coverage td.line-count { color: #94a3b8; padding: 0 10px 0 14px; }
table.coverage td.line-coverage span.cline-any { padding: 0 8px; }
.ac-legenda { display: flex; flex-wrap: wrap; gap: 6px 18px; align-items: center; margin: 8px 0 0; font-size: .8rem; color: #475569; }
.ac-amostra { display: inline-block; min-width: 26px; height: 18px; margin-right: 6px; border-radius: 3px; vertical-align: middle; font: 11px/18px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace; text-align: center; }
.ac-amostra.coberta { background: var(--color-covered); }
.ac-amostra.descoberta { background: var(--color-uncovered); }
.ac-amostra.vezes { background: var(--color-high); color: #047857; }
.ac-amostra.ramo { background: var(--color-missing-if-bg); color: var(--color-missing-if); padding: 0 4px; }
.footer { color: #475569; }
`;

function listarHtml(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) return listarHtml(caminho);
    return item.name.endsWith('.html') ? [caminho] : [];
  });
}

/**
 * Aplica o visual do AulaCerta ao relatório de cobertura do Istanbul (cobertura/): mesma fonte,
 * cores e marca do front-end, textos em português, legenda das cores e links de volta.
 * O conteúdo (código linha a linha, barras e números) continua o mesmo.
 */
function vestirCobertura(pastaDaExecucao) {
  const raiz = join(pastaDaExecucao, 'cobertura');
  if (!existsSync(join(raiz, 'index.html'))) return;
  writeFileSync(join(raiz, 'aulacerta.css'), CSS_COBERTURA);
  const traducoes = [
    [/<html lang="en">/, '<html lang="pt-BR" data-theme="light">'],
    [/\s*<script src="[^"]*theme\.js"><\/script>/, ''],
    [/<label class="theme-select[\s\S]*?<\/label>/, ''],
    [/<title>Code coverage report for All files<\/title>/, '<title>Cobertura do código — todos os arquivos</title>'],
    [/<title>Code coverage report for ([^<]*)<\/title>/, '<title>Cobertura do código — $1</title>'],
    [/>All files</g, '>Todos os arquivos<'],
    [/>(\s*)Statements(\s*)</g, '>$1Instruções$2<'],
    [/>(\s*)Branches(\s*)</g, '>$1Ramificações$2<'],
    [/>(\s*)Functions(\s*)</g, '>$1Funções$2<'],
    [/>(\s*)Lines(\s*)</g, '>$1Linhas$2<'],
    [/>File</g, '>Arquivo<'],
    [
      /Press <em>n<\/em> or <em>j<\/em> to go to the next uncovered block, <em>b<\/em>, <em>p<\/em> or <em>k<\/em> for the previous block\./,
      'Tecle <em>n</em> ou <em>j</em> para ir ao próximo trecho sem cobertura, e <em>b</em>, <em>p</em> ou <em>k</em> para o anterior.',
    ],
    [/(\s)Filter:(\s)/, '$1Filtrar:$2'],
    [/Code coverage generated by/, 'Cobertura gerada pelo'],
    [/\sat (\d{4}-\d\d-\d\dT[\d:.]+Z)/, (_, iso) => ` em ${emBrasilia(new Date(iso)).legivel} (horário de Brasília)`],
  ];
  const legenda = `<p class="ac-legenda"><span><span class="ac-amostra coberta"></span>executado pelos testes</span><span><span class="ac-amostra descoberta"></span>não executado</span><span><span class="ac-amostra vezes">3x</span>quantas vezes a linha rodou</span><span><span class="ac-amostra ramo">I</span><span class="ac-amostra ramo">E</span>caminho do if/else que nenhum teste percorreu</span></p>`;

  for (const arquivo of listarHtml(raiz)) {
    let html = readFileSync(arquivo, 'utf8');
    if (html.includes('aulacerta.css')) continue;
    const profundidade = relative(raiz, dirname(arquivo)).split(/[\\/]/).filter(Boolean).length;
    const volta = '../'.repeat(profundidade);
    for (const [de, para] of traducoes) html = html.replace(de, para);
    html = html
      .replace(
        /(<link rel="stylesheet" href="[^"]*base\.css" \/>)/,
        `$1\n    ${FONTES.split('\n').join('\n    ')}\n    <link rel="stylesheet" href="${volta}aulacerta.css" />`,
      )
      .replace(
        '<body>',
        `<body>
<header class="ac-topo"><div class="ac-conteudo">
  <a class="ac-marca" href="${volta}../../../index.html" aria-label="Todas as execuções">${logo()}<span class="nome">Aula<b>Certa</b></span><small>Cobertura do código</small></a>
  <nav aria-label="Navegação dos relatórios"><a href="${volta}../html/index.html">← Testes desta execução</a><a href="${volta}index.html">Todos os arquivos</a><a href="${volta}../../../index.html">Todas as execuções</a></nav>
</div></header>`,
      );
    // Páginas com o código: legenda das cores logo abaixo da explicação das teclas.
    if (html.includes('<table class="coverage">'))
      html = html.replace(/(para o anterior\.\s*<\/p>)/, `$1\n        ${legenda}`);
    writeFileSync(arquivo, html);
  }
}

// ------------------------------------------------------------------ índice

function gerarIndice() {
  const execucoes = [];
  for (const tipo of Object.keys(TIPOS)) {
    const pastaDoTipo = join(PASTA_RELATORIOS, tipo);
    if (!existsSync(pastaDoTipo)) continue;
    for (const carimbo of readdirSync(pastaDoTipo)) {
      const resumo = lerJson(join(pastaDoTipo, carimbo, 'resumo.json'));
      // Sem resumo (execução interrompida ou anterior a este script): fica fora do índice.
      if (resumo) execucoes.push({ ...resumo, cobertura: coberturaDoResumo(resumo) });
    }
  }
  execucoes.sort((a, b) => b.carimbo.localeCompare(a.carimbo));

  const ultimaDe = Object.keys(TIPOS)
    .map((tipo) => execucoes.find((e) => e.tipo === tipo))
    .filter(Boolean);
  const tudoAprovado = ultimaDe.length > 0 && ultimaDe.every((e) => e.situacao === 'APROVADO');
  const somar = (campo) => ultimaDe.reduce((soma, e) => soma + (e.totais?.[campo] ?? 0), 0);
  const ok = (e) => e.situacao === 'APROVADO';
  const selo = (e) => `<span class="selo ${ok(e) ? '' : 'falha'}">${ok(e) ? 'Aprovado' : 'Reprovado'}</span>`;

  const cartao = (e) => {
    const base = `${e.tipo}/${e.carimbo}`;
    const tem = (r) => e.relatorios.includes(r);
    return `
      <article class="tipo cartao ${ok(e) ? '' : 'falha'}">
        <div class="cabeca"><p class="titulo">${escapar(e.titulo)}</p>${selo(e)}</div>
        <div class="linha-metrica"><span>Testes</span><strong>${e.totais ? `${e.totais.aprovados}/${e.totais.total}` : '—'}</strong></div>
        ${barraDeTestes(e.totais)}
        ${
          e.cobertura
            ? `<div class="linha-metrica"><span>Cobertura de linhas</span><strong>${porcento(e.cobertura.linhas)}</strong></div>${barraDePercentual(
                e.cobertura.linhas,
              )}`
            : '<div class="linha-metrica"><span>Cobertura</span><strong class="sem">não medida</strong></div>'
        }
        <p class="data">${escapar(e.inicio)} · ${segundos(e.duracao)}</p>
        <div class="botoes">
          ${tem('html/index.html') ? `<a class="botao principal pequeno" href="${escapar(`${base}/html/index.html`)}">Relatório</a>` : ''}
          <a class="botao secundario pequeno" href="${escapar(`${base}/execucao.log`)}">Log</a>
          ${tem('cobertura/index.html') ? `<a class="botao secundario pequeno" href="${escapar(`${base}/cobertura/index.html`)}">Cobertura</a>` : ''}
        </div>
      </article>`;
  };

  const linha = (e) => {
    const base = `${e.tipo}/${e.carimbo}`;
    const links = [`<a href="${escapar(`${base}/execucao.log`)}">log</a>`]
      .concat(
        e.relatorios.map(
          (r) => `<a href="${escapar(`${base}/${r}`)}">${r.startsWith('cobertura') ? 'cobertura' : 'relatório'}</a>`,
        ),
      )
      .join(' · ');
    return `<tr>
          <td class="quando">${escapar(e.inicio)}</td>
          <td>${escapar(TIPOS[e.tipo]?.curto ?? e.titulo)}</td>
          <td>${selo(e)}</td>
          <td class="com-barra"><span>${e.totais ? `${e.totais.aprovados}/${e.totais.total}` : '—'}</span>${barraDeTestes(e.totais)}</td>
          <td class="com-barra">${
            e.cobertura
              ? `<span>${porcento(e.cobertura.linhas)}</span>${barraDePercentual(e.cobertura.linhas)}`
              : '<span class="sem">—</span>'
          }</td>
          <td>${segundos(e.duracao)}</td>
          <td><code>${escapar(e.branch)}</code><br><code>${escapar(e.commit)}</code>${e.alterado ? ' *' : ''}</td>
          <td class="links">${links}</td>
        </tr>`;
  };

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatórios de testes — AulaCerta</title>
${FONTES}
<style>${CSS_AULACERTA}
  .cartoes { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px; }
  .tipo { display:flex; flex-direction:column; gap:8px; padding:18px; }
  .tipo .cabeca { display:flex; justify-content:space-between; align-items:center; gap:8px; }
  .tipo .titulo { margin:0; font-weight:700; color:var(--primary); line-height:1.35; }
  .tipo .cabeca { align-items:flex-start; margin-bottom:4px; }
  .linha-metrica { display:flex; justify-content:space-between; align-items:baseline; font-size:.8rem; color:var(--suave); margin-top:4px; }
  .linha-metrica strong { color:var(--tinta); font-size:1rem; }
  .sem { color:var(--neutro) !important; font-weight:600; font-size:.8rem !important; }
  .tipo .data { margin:4px 0 0; font-size:.8rem; color:var(--suave); }
  .tipo .botoes { display:flex; flex-wrap:wrap; gap:6px; margin-top:auto; padding-top:6px; }
  .tipo .botoes .botao { padding:0 10px; }
  .tabela { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:.85rem; }
  th, td { text-align:left; padding:12px 14px; border-bottom:1px solid var(--borda); vertical-align:middle; }
  th { background:#f8fafc; font-weight:700; color:var(--tinta); white-space:nowrap; }
  tr:last-child td { border-bottom:none; }
  tbody tr:hover td { background:#fafbff; }
  td.quando { white-space:nowrap; }
  td.com-barra { min-width:110px; }
  td.com-barra span { display:block; font-weight:700; margin-bottom:4px; }
  td.com-barra .barra { height:6px; }
  td.links { white-space:nowrap; }
  td code { font-size:.75rem; color:var(--suave); }
  .nota { color:var(--suave); font-size:.8rem; margin-top:8px; }
</style>
</head>
<body>
${topo('', [
  ['#ultimas', 'Última de cada tipo'],
  ['#todas', 'Todas as execuções'],
])}
<main class="conteudo">
  <section class="painel">
    <h1>Relatórios de testes</h1>
    <span class="selo ${tudoAprovado ? '' : 'falha'}">${tudoAprovado ? 'Tudo aprovado' : 'Há falhas'}</span>
    <p>Atualizado em ${escapar(emBrasilia().legivel)} (horário de Brasília).</p>
    ${
      ultimaDe.length
        ? `<div class="numeros">
      <div class="numero ok"><strong>${somar('aprovados')}</strong><span>testes aprovados</span></div>
      <div class="numero ${somar('falharam') ? 'falha' : ''}"><strong>${somar('falharam')}</strong><span>falharam</span></div>
      <div class="numero"><strong>${execucoes.length}</strong><span>execuções registradas</span></div>
    </div>
    ${barraDeTestes({ total: somar('total'), aprovados: somar('aprovados'), falharam: somar('falharam'), ignorados: somar('ignorados') + somar('instaveis') })}`
        : ''
    }
  </section>
  <h2 id="ultimas">Última execução de cada tipo</h2>
  <div class="cartoes">${ultimaDe.map(cartao).join('') || '<p>Nenhuma execução registrada ainda.</p>'}
  </div>
  <h2 id="todas">Todas as execuções</h2>
  <div class="tabela cartao">
    <table>
      <thead><tr><th>Início</th><th>Tipo</th><th>Situação</th><th>Testes</th><th>Cobertura</th><th>Duração</th><th>Branch · commit</th><th>Arquivos</th></tr></thead>
      <tbody>
        ${execucoes.map(linha).join('\n        ')}
      </tbody>
    </table>
  </div>
  <p class="nota">* executado com alterações ainda não commitadas.</p>
</main>
</body>
</html>
`;
  mkdirSync(PASTA_RELATORIOS, { recursive: true });
  writeFileSync(join(PASTA_RELATORIOS, 'index.html'), html);
  return join(PASTA_RELATORIOS, 'index.html');
}

// ------------------------------------------------------------------ entrada

const pedido = process.argv[2];

// "indice": só refaz o relatorios/index.html (por exemplo, depois de apagar execuções antigas).
if (pedido === 'indice') {
  console.log(`Índice refeito: ${barras(relative(RAIZ, gerarIndice()))}`);
  process.exit(0);
}

const ordem = pedido === 'todos' ? Object.keys(TIPOS) : [pedido];
if (!pedido || ordem.some((t) => !TIPOS[t])) {
  console.error(`Uso: node scripts/registrar-testes.mjs <${Object.keys(TIPOS).join(' | ')} | todos | indice>`);
  process.exit(2);
}

const resultados = [];
for (const tipo of ordem) resultados.push(await executar(tipo));
const indice = gerarIndice();

if (resultados.length > 1) {
  console.log('\n=== Resumo ===');
  for (const r of resultados)
    console.log(`${r.situacao.padEnd(10)} ${r.titulo ?? r.tipo}: ${descreverTotais(r.totais)}`);
}
console.log(`\nÍndice de todas as execuções: ${barras(relative(RAIZ, indice))}`);
process.exit(resultados.every((r) => r.codigo === 0) ? 0 : 1);
