# C06 — Acompanhamento das aulas

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
| Cenário | C06 — Acompanhamento das aulas |
| Requisitos | RF17 Acompanhar status da aula (Must) · RF18 Consultar histórico de aulas (Should) · RF19 Enviar lembrete (Should) |
| Histórias de usuário | US17, US18, US19 |
| Casos do roteiro | CT10 (Documento de Visão, seção 6.2) |
| Sprint | 5 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

Rotas sob `/api/v1`: `GET /aulas` (filtros de status e período, com paginação) e `GET /aulas/:id` (detalhe e histórico). Situação em 14/11/2026: a API de consulta já existe e está testada; na interface, o selo de status aparece nas aulas, mas nenhuma aula passa sozinha a "realizada" (RF17 parcial) e a aba Histórico ainda não tem filtros (RF18 parcial). Os lembretes (RF19) não foram implementados. Anotações (RF20) e avaliação de aulas (RF21) estão fora do escopo do semestre (Documento de Visão, Quadro 9).

## 2. Critérios de aceitação testáveis

- [ ] **RF17** — Aluno vê suas aulas com o status correto, inclusive "realizada" — CT10 (pendente: Sprint 5)
- [x] **RF17 / RF18** — A API filtra por status e período e devolve o detalhe com o histórico de mudanças de status — CT10.1, CT10.2
- [x] **RF17 / RF18** — Consultas e paginação mostram apenas aulas do participante; filtros inválidos são recusados — CT10.3, CT10.4
- [ ] **RF18** — A tela de histórico permite filtrar as aulas — CT10 (pendente: Sprint 5)
- [ ] **RF19** — Aluno e professor veem lembrete de aula confirmada nas próximas 24 h, sem duplicação — CT10.5, CT10.6 (bloqueado)

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT10 | Status e histórico pela interface | RF17, RF18 | Sistema | Todas as aulas listadas com o status correto, com filtros no histórico | ⚪ Pendente | 0 | — |
| CT10.1 | Filtrar aulas por status e por período | RF17, RF18 | Integração | Somente aulas do usuário compatíveis com o filtro | ✅ Aprovado | 1 | — |
| CT10.2 | Consultar o detalhe de aula com mudanças de status | RF17, RF18 | Integração | Status atual e histórico das transições | ✅ Aprovado | 1 | — |
| CT10.3 | Paginar aulas e tentar detalhar aula de outro usuário | RF17, RF18 | Integração | Isolamento por participante; detalhe de terceiros negado | ✅ Aprovado | 1 | — |
| CT10.4 | Consultar com status inexistente, período inválido ou paginação inválida | RF17, RF18 | Integração | Consulta recusada com validação | ✅ Aprovado | 1 | — |
| CT10.5 | Acessar a aplicação com aulas confirmadas dentro e fora das próximas 24 h<br>**Observação:** funcionalidade ainda não implementada | RF19 | Sistema | Lembrete só para aula confirmada nas próximas 24 h | ⛔ Bloqueado | 0 | — |
| CT10.6 | Acessar repetidamente a aplicação na janela do lembrete<br>**Observação:** funcionalidade ainda não implementada | RF19 | Integração | Um único lembrete por aula e destinatário | ⛔ Bloqueado | 0 | — |

**Legenda:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado

**Testes que comprovam cada caso**

| Caso | Teste automatizado |
|---|---|
| CT10 | **Pendente:** depende da conclusão de RF17 e RF18 na Sprint 5. O componente `minhas-aulas.test.tsx` já verifica as abas Próximas, Pendentes e Histórico |
| CT10.1 | Integração `aulas.test.ts`: "filtra por status e período e pagina o resultado" |
| CT10.2 | Integração: "cria a aula como SOLICITADA, grava histórico…" e "confirma a aula, grava histórico…" (histórico no detalhe) |
| CT10.3 | Integração: "lista somente as aulas de cada participante" e "nega a quem não participa, responde 404 e valida o id" |
| CT10.4 | Integração: "valida os filtros e exige login" |

## 4. Execuções

Registre cada execução abaixo, da mais recente para a mais antiga.

### Execução 1 — 14/11/2026

| Campo | Valor |
|---|---|
| Responsável | Pedro França |
| Branch / commit | Branch `test/casos-pendentes-do-roteiro`: código do commit `a6b0102` da `developer` mais os testes complementares desta branch |
| Motivo | Execução completa dos testes automatizados; a API de consulta foi entregue na Sprint 4 |
| Casos executados | CT10.1 a CT10.4 |

| Caso | Observado | Status |
|---|---|---|
| CT10.1 | Filtros de status e período e paginação corretos | ✅ |
| CT10.2 | Detalhe com o histórico das transições (solicitada, confirmada) | ✅ |
| CT10.3 | Cada participante vê só as próprias aulas; detalhe de terceiros negado | ✅ |
| CT10.4 | Filtros inválidos recusados com 422; sem login, 401 | ✅ |

Saída dos testes automatizados (`npm run testes`, na raiz):

```text
Back-end — testes de integração:
  ✓ tests/integration/aulas.test.ts (27 tests)
  73 de 73 aprovados
```

Evidências: [relatório de testes](../assets/qualidade/relatorio-de-testes/index.html).

**Resultado:** 4 casos executados, 4 aprovados; CT10 pendente e CT10.5 e CT10.6 bloqueados até a Sprint 5.

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito encontrado | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!--
### DEF-C06-nn — Título do defeito

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

Meta da métrica **M6**: no mínimo **70%** em instruções, ramificações, funções e linhas, medidos pelo Vitest.

| Arquivo | Linhas | Ramificações | Observação |
|---|---|---|---|
| `backend/src/modules/aulas/aulas.service.ts` | 100% | 96,9% | Listagem, detalhe e histórico |
| `frontend/src/pages/minhas-aulas.tsx` | 90,9% | 89,1% | Abas Próximas, Pendentes e Histórico |

## 7. Parecer final

**Situação:** ⚪ Pendente

A consulta de aulas pela API (status, período, detalhe e histórico) está comprovada. O cenário só pode ser aprovado na Sprint 5, quando RF17 (status "realizada"), RF18 (filtros na tela de histórico) e RF19 (lembretes) estiverem implementados e o CT10 for executado pela interface.

## 8. Contribuições

| Integrante | Pontos de contribuição |
|---|---|
| Pedro Rodrigues | A preencher |
| Yasmim Ayres | A preencher |
| **Total** | **100** |
