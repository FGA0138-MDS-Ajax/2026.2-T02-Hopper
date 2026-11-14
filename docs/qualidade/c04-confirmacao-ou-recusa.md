# C04 — Confirmação ou recusa de aula

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
| Cenário | C04 — Confirmação ou recusa de aula |
| Requisitos | RF11 Aceitar ou recusar solicitação (Must) · RF12 Bloquear horário e impedir conflito (Must) · RF13 Notificar na plataforma (Must) |
| Histórias de usuário | US11, US12, US13 |
| Casos do roteiro | CT05, CT06, CT07 (Documento de Visão, seção 6.2) |
| Sprint | 4 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

Rotas sob `/api/v1`: `PATCH /aulas/:id/aceitar`, `PATCH /aulas/:id/recusar` e `GET/PATCH /notificacoes`. O aceite reserva a agenda do professor dentro de uma transação, confirma a aula, recusa automaticamente os outros pedidos pendentes para o mesmo horário e notifica os alunos; o banco impede duas aulas confirmadas sobrepostas com a restrição `aula_sem_sobreposicao` (Documento de Arquitetura, seção 2.4).

## 2. Critérios de aceitação testáveis

- [x] **RF11** — O professor do pedido aceita uma solicitação pendente, confirmando a aula — CT06
- [x] **RF11** — O professor recusa uma solicitação com motivo opcional, mantendo o horário livre — CT07, CT07.1
- [x] **RF11** — Aluno, visitante ou outro professor não decide sobre o pedido; transições repetidas ou inválidas são recusadas — CT06.1, CT06.2, CT07.2, CT07.3
- [x] **RF12** — Pedido ou aceite sobreposto a uma aula que ocupa a agenda é recusado (M4 = 0) — CT05, CT05.4
- [x] **RF12** — Aceites simultâneos confirmam no máximo uma aula; a restrição no banco também impede a sobreposição — CT05.1, CT05.5
- [x] **RF12** — Intervalos adjacentes e aulas de professores diferentes não são confundidos com conflito — CT05.2, CT05.3
- [x] **RF13** — Aluno e professor recebem os avisos das mudanças de status, sem ver os de outros usuários — CT06, CT07, CT06.3
- [x] **RF12 / RF13** — Falha durante a operação não deixa horário confirmado sem a notificação e o histórico correspondentes — CT06.4

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT05 | Impedir conflito de horário | RF12 | Unitário e integração | Pedido ou aceite recusado; nenhuma reserva duplicada (M4 = 0) | ✅ Aprovado | 1 | [DEF-C04-01](#def-c04-01-aceites-simultaneos-do-mesmo-horario-respondem-com-erro-500) |
| CT05.1 | Aceitar ao mesmo tempo dois pedidos sobrepostos do mesmo professor | RF12 | Integração | Um aceite confirmado (200) e o outro recusado com conflito (409); M4 = 0 | ✅ Aprovado | 1 | [DEF-C04-01](#def-c04-01-aceites-simultaneos-do-mesmo-horario-respondem-com-erro-500) |
| CT05.2 | Aceitar aulas consecutivas (fim de uma igual ao início da outra) | RF12 | Unitário e integração | Ambas confirmadas; intervalos consecutivos não se sobrepõem | ✅ Aprovado | 1 | — |
| CT05.3 | Aceitar aulas no mesmo horário com professores diferentes | RF12 | Integração | Não há conflito entre agendas de professores diferentes | ✅ Aprovado | 1 | — |
| CT05.4 | Confirmar uma aula com outro pedido pendente no mesmo horário | RF12 | Unitário e integração | O outro pedido é recusado automaticamente, e aceitá-lo depois é recusado (M4 = 0) | ✅ Aprovado | 1 | — |
| CT05.5 | Gravar diretamente no banco duas aulas confirmadas sobrepostas | RF12 | Integração | A restrição `aula_sem_sobreposicao` impede a gravação | ✅ Aprovado | 1 | — |
| CT06 | Aceitar solicitação | RF11, RF12, RF13 | Sistema | Status "confirmada", horário bloqueado e aluno notificado | ✅ Aprovado | 1 | — |
| CT06.1 | Aceitar sem token, como aluno ou como professor que não é dono do pedido | RF11 | Integração | Acesso negado (401 ou 403) | ✅ Aprovado | 1 | — |
| CT06.2 | Aceitar de novo pedido já confirmado ou já recusado | RF11, RF12 | Unitário e integração | Transição inválida recusada (400) | ✅ Aprovado | 1 | — |
| CT06.3 | Consultar avisos após a decisão e tentar ler ou marcar avisos de outro usuário | RF13 | Integração | Cada usuário vê e marca só os próprios avisos | ✅ Aprovado | 1 | — |
| CT06.4 | Falha induzida na gravação da notificação durante o aceite | RF12, RF13 | Integração | Transação desfeita; nada gravado pela metade | ✅ Aprovado | 1 | — |
| CT07 | Recusar solicitação | RF11 | Sistema | Status "recusada", horário continua livre e aluno notificado | ✅ Aprovado | 1 | — |
| CT07.1 | Recusar com e sem motivo | RF11 | Integração | Status "recusada" e histórico registrados; motivo opcional | ✅ Aprovado | 1 | — |
| CT07.2 | Recusar como aluno ou como professor de outra aula | RF11 | Integração | Acesso negado (403) | ✅ Aprovado | 1 | — |
| CT07.3 | Recusar aula já recusada ou em estado não permitido | RF11 | Unitário e integração | Transição recusada (400) | ✅ Aprovado | 1 | — |

**Legenda:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado

**Testes que comprovam cada caso**

| Caso | Teste automatizado |
|---|---|
| CT05 | Integração `aulas.test.ts`, grupo "conflito de horário (CT05, RF12)"; unitário `aulas.service.test.ts`: "propaga o conflito detectado pela restrição do banco e não notifica" |
| CT05.1 | Integração: "aceita apenas uma de duas confirmações simultâneas do mesmo horário" |
| CT05.2 | Integração: "permite aulas consecutivas, pois o intervalo é semiaberto"; unitário: "permite aulas consecutivas (intervalo semiaberto)" |
| CT05.3 | Integração `aulas.test.ts`: "confirma aulas no mesmo horário com professores diferentes (CT05.3)" |
| CT05.4 | Integração: "ao confirmar uma aula, recusa o outro pedido do mesmo horário e avisa o aluno" |
| CT05.5 | Integração: "o banco recusa duas aulas confirmadas sobrepostas mesmo fora da API" |
| CT06 | Playwright: "CT06 — professor aceita: aula confirmada, horário bloqueado e aluno avisado"; integração: "confirma a aula, grava histórico e notifica o aluno" |
| CT06.1 | Integração: "só o professor da aula pode confirmar e não se confirma duas vezes" (aluno e outro professor 403; sem token 401) |
| CT06.2 | Integração: mesmo teste (segunda confirmação 400) e aceite do pedido recusado automaticamente (400); unitário: "rejeita transição inválida com 400" |
| CT06.3 | Integração `notificacoes.test.ts`: "pagina, filtra não lidas e nunca mostra notificações de outro usuário" e "não altera notificações de outro usuário" |
| CT06.4 | Integração: "desfaz o aceite inteiro quando a gravação da notificação falha (CT06.4)" (um gatilho temporário no banco de teste força a falha) |
| CT07 | Playwright: "CT07 — professor recusa: aula recusada, horário continua livre e aluno avisado"; integração: "recusa com motivo, grava histórico, notifica o aluno e libera o horário" |
| CT07.1 | Integração: "recusa com motivo…" e "recusa sem corpo, não repete a recusa e respeita as permissões" |
| CT07.2 | Integração: "recusa sem corpo, não repete a recusa e respeita as permissões" |
| CT07.3 | Integração: mesmo teste (recusa repetida 400); unitário `aulas.estados.test.ts`: transições não previstas são rejeitadas |

## 4. Execuções

Registre cada execução abaixo, da mais recente para a mais antiga.

### Execução 1 — 14/11/2026

| Campo | Valor |
|---|---|
| Responsável | Pedro França |
| Branch / commit | Branch `test/casos-pendentes-do-roteiro`: código do commit `a6b0102` da `developer` mais os testes complementares desta branch |
| Motivo | Última execução dos testes automatizados das Sprints 3 e 4 (`npm run testes`, às 13h47) |
| Casos executados | CT05, CT05.1 a CT05.5, CT06, CT06.1 a CT06.4, CT07, CT07.1 a CT07.3 |

| Caso | Observado | Status |
|---|---|---|
| CT05 e CT05.4 | Ao confirmar, o outro pedido do mesmo horário foi recusado e o aluno avisado; aceitá-lo depois respondeu 400 | ✅ |
| CT05.1 | Das duas confirmações simultâneas, uma respondeu 200 e a outra 409; uma aula confirmada e uma recusada | ✅ |
| CT05.2 | Aulas consecutivas confirmadas | ✅ |
| CT05.3 | Dois professores confirmaram aulas no mesmo horário, sem conflito | ✅ |
| CT05.5 | Gravação direta de aulas sobrepostas recusada pela restrição do banco | ✅ |
| CT06 | Aula confirmada, horário saiu do perfil público e o aluno recebeu o aviso | ✅ |
| CT06.1 a CT06.3 | Acessos indevidos recusados (401/403); segunda confirmação 400; avisos isolados por usuário | ✅ |
| CT06.4 | Com a falha induzida, o aceite respondeu 500 e nada mudou (aula "solicitada", histórico e notificações iguais); sem a falha, o mesmo aceite funcionou | ✅ |
| CT07 a CT07.3 | Recusa com e sem motivo; horário continuou livre; recusa repetida 400; acessos indevidos 403 | ✅ |

Saída dos testes automatizados (`npm run testes`, na raiz):

```text
Back-end — testes de integração:
  ✓ tests/integration/aulas.test.ts (27 tests)
  ✓ tests/integration/notificacoes.test.ts (7 tests)
  73 de 73 aprovados
Sistema (Playwright):
  ok 7 › CT06 — professor aceita: aula confirmada, horário bloqueado e aluno avisado (5.1s)
  ok 8 › CT07 — professor recusa: aula recusada, horário continua livre e aluno avisado (4.7s)
```

Evidências: [relatório de testes](../assets/qualidade/relatorio-de-testes/index.html) e [relatório do Playwright](../assets/qualidade/relatorio-de-testes/e2e/2026-11-14_13-50-04/html/index.html).

**Resultado:** 15 casos executados, 15 aprovados; M4 = 0.

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| DEF-C04-01 | CT05.1 | Aceites simultâneos do mesmo horário respondem com erro 500 | Médio | — | Corrigido |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

### DEF-C04-01 — Aceites simultâneos do mesmo horário respondem com erro 500

| Campo | Valor |
|---|---|
| Caso | CT05.1 |
| Encontrado em | Durante o desenvolvimento, na primeira rodada dos testes de integração com o banco de teste (14/11/2026), antes da correção |
| Esperado | Uma confirmação aceita (200) e a outra recusada com conflito (409) |
| Observado | Uma das requisições respondia 500 |
| Severidade | Médio (não duplica reservas, mas mostra um erro genérico ao professor) |
| Issue | — (sem issue aberta) |

**Correção**

| Campo | Valor |
|---|---|
| Responsável | Pedro França |
| Branch / PR | `fix/rf12-aceites-simultaneos` · [PR #10](https://github.com/FGA0138-MDS-Ajax/2026.2-T02-Hopper/pull/10) → `developer` |
| Causa | Com a recusa automática dos pedidos sobrepostos (PR #7), duas confirmações simultâneas confirmavam cada uma a própria aula e tentavam recusar a outra; as transações ficavam esperando uma pela outra (deadlock), o banco desfazia uma delas e a API respondia 500 |
| Alteração | O aceite passou a reservar a agenda do professor no início da transação (`SELECT … FOR UPDATE`), o que coloca os aceites simultâneos em fila; conflitos entre transações que ainda escapem passaram a responder 409 (`OPERACAO_CONCORRENTE`). Os testes de integração do CT05 foram atualizados para a regra da recusa automática |
| Reteste | Execução 1 (14/11/2026) — CT05.1 aprovado |

<!--
### DEF-C04-nn — Título do defeito

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
| `backend/src/modules/aulas/aulas.service.ts` | 100% | 96,9% | Aceite, recusa e conflito de horário |
| `backend/src/modules/notificacoes/notificacoes.service.ts` | 100% | 100% | Notificações na aplicação |
| `frontend/src/pages/minhas-aulas.tsx` | 90,9% | 89,1% | Pedidos pendentes e decisões |
| `frontend/src/pages/notificacoes.tsx` | 90,0% | 85,4% | Tela de notificações |

## 7. Parecer final

**Situação:** ✅ Aprovado

Os critérios de RF11, RF12 e RF13 estão comprovados, com M4 = 0 inclusive em aceites simultâneos, e a cobertura está acima da meta M6. Todos os casos foram aprovados na última execução, de 14/11/2026. O defeito encontrado no desenvolvimento (DEF-C04-01) foi corrigido e retestado.

## 8. Contribuições

| Integrante | Pontos de contribuição |
|---|---|
| Pedro Rodrigues | A preencher |
| Yasmim Ayres | A preencher |
| **Total** | **100** |
