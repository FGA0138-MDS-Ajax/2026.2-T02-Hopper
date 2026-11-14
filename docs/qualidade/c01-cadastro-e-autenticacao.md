# C01 — Cadastro e Autenticação de Usuários

!!! abstract "Relatório de testes"
    Resultado da última execução dos testes automatizados (14/11/2026): log, resultado de cada teste, cobertura do código e capturas de tela do Playwright.

    [Acessar o relatório de testes](../assets/qualidade/relatorio-de-testes/index.html){ .md-button .md-button--primary }

!!! info "Como atualizar esta página"
    1. **Ao testar:** rode `npm run testes` na raiz do repositório, registre a execução na seção 4 e atualize o status dos casos na seção 3.
    2. **Se um caso falhar:** marque ❌ na seção 3 e registre o defeito na seção 5, com a situação **Aberto**.
    3. **Ao corrigir:** preencha o bloco de correção do defeito na seção 5 (branch, PR e causa) e mude a situação para **Em reteste**.
    4. **Ao retestar:** registre uma nova execução na seção 4, volte o caso para ✅ na seção 3 e mude o defeito para **Corrigido**.

    Registre apenas resultados de testes efetivamente executados.

## 1. Identificação

| Campo | Valor |
|---|---|
| Cenário | C01 — Cadastro e autenticação de usuários |
| Requisitos | RF01 Cadastrar usuário (Must) · RF02 Autenticar usuário (Must) · RF03 Recuperar senha (Should) · RNF03 Segurança (Must) |
| Histórias de usuário | US01, US02, US03 |
| Casos do roteiro | CT01, CT02, CT13 (Documento de Visão, seção 6.2) |
| Sprint | 3 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

## 2. Critérios de aceitação testáveis

- [x] **RF01** — Visitante se cadastra como aluno ou professor, com nome, e-mail, senha e telefone; o aluno vai para a busca de professores e o professor, para a edição do perfil — CT01, CT01.1
- [x] **RF01** — Cadastro sem campos obrigatórios é recusado indicando os campos — CT01.2
- [x] **RF02** — Usuário entra com e-mail e senha válidos e recebe um token JWT — CT02.1
- [x] **RF02** — Credenciais incorretas são recusadas com mensagem clara, sem revelar qual dado está errado — CT02
- [x] **RF02** — Usuário consegue sair da plataforma e perde o acesso às telas protegidas — CT02.2
- [x] **RF03** — Usuário recebe por e-mail um link para redefinir a senha e consegue entrar com a nova senha — CT03.1 a CT03.4
- [x] **RNF03** — Senhas são armazenadas apenas como hash bcrypt e nunca devolvidas pela API — CT13

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT01 | Cadastro com dados válidos | RF01 | Sistema | Conta criada; aluno vai para a busca de professores e professor, para a edição do perfil | ✅ Aprovado | 1 | [DEF-C01-01](#def-c01-01-usuario-nao-e-direcionado-ao-destino-certo-apos-o-cadastro) |
| CT01.1 | Cadastro com e-mail já existente | RF01 | Integração | Cadastro recusado com mensagem clara | ✅ Aprovado | 1 | — |
| CT01.2 | Cadastro sem campos obrigatórios | RF01 | Integração | Cadastro recusado indicando os campos faltantes | ✅ Aprovado | 1 | — |
| CT02 | Login com credenciais incorretas | RF02 | Integração e sistema | Acesso negado com mensagem clara, sem revelar qual dado está errado | ✅ Aprovado | 1 | — |
| CT02.1 | Login com credenciais válidas | RF02 | Integração | Token JWT retornado | ✅ Aprovado | 1 | — |
| CT02.2 | Sair da plataforma | RF02 | Sistema | Sessão encerrada e rotas protegidas inacessíveis | ✅ Aprovado | 1 | — |
| CT03.1 | Solicitar recuperação com e-mail cadastrado | RF03 | Integração | E-mail com link de redefinição enviado | ✅ Aprovado | 1 | — |
| CT03.2 | Solicitar recuperação com e-mail não cadastrado | RF03 | Integração | Resposta genérica, sem revelar se o e-mail existe | ✅ Aprovado | 1 | — |
| CT03.3 | Redefinir senha com token válido e entrar com a nova senha | RF03 | Integração | Senha antiga recusada e nova senha aceita | ✅ Aprovado | 1 | — |
| CT03.4 | Redefinir senha com token inválido, expirado ou já usado | RF03 | Unitário e integração | Redefinição recusada | ✅ Aprovado | 1 | — |
| CT13 | Armazenamento de senha | RNF03 | Unitário e integração | Senha armazenada apenas como hash bcrypt e nunca devolvida pela API | ✅ Aprovado | 1 | — |

**Legenda:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado

**Testes que comprovam cada caso**

| Caso | Teste automatizado |
|---|---|
| CT01 | Playwright: "CT01 — aluno se cadastra e vai para a busca de professores" e "CT01 — professor se cadastra e vai completar o perfil"; componente: `cadastro.test.tsx` ("aluno novo sem destino vai para a busca de professores (CT01)") |
| CT01.1 | Integração `auth.test.ts`: "recusa e-mail duplicado com 409"; componente: "avisa no campo quando o e-mail já tem conta" |
| CT01.2 | Integração `auth.test.ts`: "recusa cadastro sem nome, e-mail ou senha e indica o campo (CT01.2)"; componente: "valida senha, telefone e consentimento antes de enviar" |
| CT02 | Integração: "usa a mesma resposta para e-mail inexistente e senha errada (CT02)"; Playwright: "CT02 — login com senha errada é recusado sem dizer qual dado está errado" |
| CT02.1 | Integração: "autentica e permite consultar o usuário atual" |
| CT02.2 | Playwright: "CT02.2 — usuário entra, sai e perde o acesso às telas protegidas" |
| CT03.1 | Integração: "envia o link, guarda só o hash e redefine a senha uma única vez" (o e-mail é capturado no teste); unitário `brevo.test.ts`: chamada à API do Brevo |
| CT03.2 | Integração: "responde 204 mesmo para e-mail inexistente e não envia mensagem" |
| CT03.3 | Integração: "envia o link, guarda só o hash e redefine a senha uma única vez" (a senha antiga passa a ser recusada) |
| CT03.4 | Integração: "recusa token expirado"; unitário: "recusa token inexistente, expirado ou já usado" |
| CT13 | Integração: "cria aluno e nunca devolve o hash da senha (CT13)"; unitário: "grava somente o hash da senha e não devolve dados sensíveis (CT13)" |

## 4. Execuções

Registre cada execução abaixo, da mais recente para a mais antiga.

### Execução 1 — 14/11/2026

| Campo | Valor |
|---|---|
| Responsável | Pedro França |
| Branch / commit | Branch `test/casos-pendentes-do-roteiro`: código do commit `a6b0102` da `developer` mais os testes complementares desta branch |
| Motivo | Última execução dos testes automatizados das Sprints 3 e 4 (`npm run testes`, às 13h47) |
| Casos executados | CT01, CT01.1, CT01.2, CT02, CT02.1, CT02.2, CT03.1 a CT03.4, CT13 |

| Caso | Observado | Status |
|---|---|---|
| CT01 | Aluno foi para "Encontrar professores" e professor, para "Meu perfil" | ✅ |
| CT01.1 | Cadastro repetido recusado com 409 e mensagem no campo de e-mail | ✅ |
| CT01.2 | Cadastro sem nome, sem e-mail ou sem senha recusado com 422, indicando o campo; nenhuma conta criada | ✅ |
| CT02 | Mesma resposta para e-mail inexistente e senha errada; a tela mostra mensagem genérica | ✅ |
| CT02.1 | Token devolvido e usuário atual consultado | ✅ |
| CT02.2 | Após sair, `/minhas-aulas` levou de volta ao login | ✅ |
| CT03.1 a CT03.4 | Link enviado só para e-mail cadastrado; nova senha aceita e antiga recusada; token expirado ou reutilizado recusado | ✅ |
| CT13 | Banco guarda hash bcrypt (`$2…`); respostas não contêm o hash | ✅ |

Saída dos testes automatizados (`npm run testes`, na raiz):

```text
Back-end — testes unitários:      133 de 133 aprovados
Back-end — testes de integração:  ✓ tests/integration/auth.test.ts (13 tests) — 73 de 73 aprovados
Front-end — testes de componentes: 194 de 194 aprovados
Sistema (Playwright):
  ok 1 › CT01 — aluno se cadastra e vai para a busca de professores (4.3s)
  ok 2 › CT01 — professor se cadastra e vai completar o perfil (2.1s)
  ok 3 › CT02 — login com senha errada é recusado sem dizer qual dado está errado (1.3s)
  ok 4 › CT02.2 — usuário entra, sai e perde o acesso às telas protegidas (1.8s)
  9 passed
```

Evidências: [relatório de testes](../assets/qualidade/relatorio-de-testes/index.html) e [relatório do Playwright](../assets/qualidade/relatorio-de-testes/e2e/2026-11-14_13-50-04/html/index.html), com captura de tela de cada teste.

**Resultado:** 11 casos executados, 11 aprovados.

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| DEF-C01-01 | CT01 | Usuário não é direcionado ao destino certo após o cadastro | Baixo | — | Corrigido |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

### DEF-C01-01 — Usuário não é direcionado ao destino certo após o cadastro

| Campo | Valor |
|---|---|
| Caso | CT01 |
| Encontrado em | Durante o desenvolvimento: em 13/11/2026, por um teste de componente; em 14/11/2026, pelo primeiro teste do Playwright, depois da 1ª correção |
| Esperado | Conta criada; aluno vai para a busca de professores e professor, para a edição do perfil |
| Observado | No teste de componente, o aluno sem página de origem voltava para a página inicial; no navegador, aluno e professor terminavam na página inicial |
| Severidade | Baixo (não perde dados nem impede o uso; o usuário chega ao destino pelo menu) |
| Issue | — (sem issue aberta) |

**Correção**

| Campo | Valor |
|---|---|
| Responsável | Pedro França |
| Branch / PR | 1ª correção: `fix/ct01-destino-do-aluno-apos-cadastro` · [PR #9](https://github.com/FGA0138-MDS-Ajax/2026.2-T02-Hopper/pull/9) → `developer`. 2ª correção: `fix/ct01-redirecionamento-no-navegador` · [PR #11](https://github.com/FGA0138-MDS-Ajax/2026.2-T02-Hopper/pull/11) → `developer` |
| Causa | 1ª: o destino padrão depois do cadastro só tratava o professor. 2ª: o cadastro já entra na conta, e a regra da página ("quem está logado sai daqui") disparava antes do redirecionamento certo; o teste de componente não pegava porque, no ambiente simulado, a ordem dos eventos é outra |
| Alteração | Aluno sem página de origem vai para "Encontrar professores"; o destino é escolhido antes de cadastrar e a própria regra da página usa esse destino, com um único redirecionamento |
| Reteste | Execução 1 (14/11/2026) — CT01 aprovado para aluno e professor, pelo Playwright e pelo teste de componente |

<!-- Para cada defeito, copie o bloco abaixo. -->

<!--
### DEF-C01-nn — Título do defeito

| Campo | Valor |
|---|---|
| Caso | CTxx |
| Encontrado em | Execução n (dd/mm/2026) |
| Esperado | |
| Observado | |
| Severidade | Crítico / Alto / Médio / Baixo |
| Issue | #nn |

**Correção**

| Campo | Valor |
|---|---|
| Responsável | |
| Branch / PR | `fix/descricao` · PR #nn → `developer` |
| Causa | |
| Alteração | |
| Reteste | Execução n (dd/mm/2026) — resultado |
-->

## 6. Cobertura

Meta da métrica **M6**: no mínimo **70%** em instruções, ramificações, funções e linhas, medidos pelo Vitest. Comando: `npm run testes:backend` e `npm run testes:frontend` (na raiz).

| Arquivo | Linhas | Ramificações | Observação |
|---|---|---|---|
| `backend/src/modules/auth/auth.service.ts` | 100% | 96,6% | Regras de cadastro, login e recuperação de senha |
| `frontend/src/pages/cadastro.tsx` | 100% | 90,0% | Tela de cadastro |
| `frontend/src/pages/entrar.tsx` | 100% | 100% | Tela de login |
| `frontend/src/pages/recuperar-senha.tsx` | 93,3% | 100% | Pedido do link |
| `frontend/src/pages/redefinir-senha.tsx` | 95,0% | 80,0% | Nova senha |

## 7. Parecer final

**Situação:** ✅ Aprovado

Os critérios de RF01, RF02, RF03 e RNF03 estão atendidos e comprovados por testes automatizados de unidade, integração e sistema, todos aprovados na última execução, de 14/11/2026. A cobertura dos arquivos do cenário está acima da meta M6. O único defeito encontrado no desenvolvimento (DEF-C01-01) foi corrigido e retestado.

## 8. Contribuições

| Integrante | Pontos de contribuição |
|---|---|
| Pedro Rodrigues | A preencher |
| Yasmim Ayres | A preencher |
| **Total** | **100** |
