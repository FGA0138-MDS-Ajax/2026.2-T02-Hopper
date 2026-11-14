# C03 — Busca de professores e solicitação de aula

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
| Cenário | C03 — Busca de professores e solicitação de aula |
| Requisitos | RF07 Buscar professores (Must) · RF08 Visualizar perfil e horários livres (Must) · RF09 Solicitar aula (Must) · RF10 Solicitar aulas recorrentes (Could) |
| Histórias de usuário | US07, US08, US09, US10 |
| Casos do roteiro | CT04 (Documento de Visão, seção 6.2) |
| Sprint | 4 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

Rotas sob `/api/v1`: `GET /materias`, `GET /professores`, `GET /professores/:id` e `POST /aulas` (Documento de Arquitetura, Quadro 2). A solicitação usa `professorId`, `materiaId`, `inicio`, `fim`, `modalidade`, `objetivo` (opcional) e, para aulas semanais, `recorrencia.semanas`; o nível vem da matéria escolhida.

## 2. Critérios de aceitação testáveis

- [x] **RF07** — A busca combina filtros por matéria, nível e modalidade e retorna apenas professores compatíveis — CT04.1
- [x] **RF07** — Busca sem correspondências retorna lista vazia, parâmetros inválidos são recusados e a paginação é coerente — CT04.2, CT04.12
- [x] **RF08** — O perfil apresenta os horários realmente livres, sem bloqueios nem aulas confirmadas — CT04.3
- [x] **RF08** — Professor inexistente, inativo ou com perfil incompleto não é exposto — CT04.4
- [x] **RF09** — Aluno envia o pedido e o professor é notificado — CT04
- [x] **RF09** — Dados obrigatórios ausentes e horário inválido são recusados sem criar aula — CT04.5, CT04.6
- [x] **RF09** — Matéria ou modalidade não oferecidas são recusadas — CT04.7
- [x] **RF09 / RF10** — Somente aluno autenticado solicita aula ou série semanal — CT04.8
- [x] **RF10** — O pedido semanal cria as ocorrências no mesmo horário, com identificação comum da série — CT04.9
- [x] **RF10** — Se uma semana estiver indisponível ou a quantidade de semanas for inválida, nada é criado — CT04.10, CT04.11

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT04 | Solicitar aula em horário livre | RF09 | Sistema | Pedido criado com status "solicitada" e professor notificado | ✅ Aprovado | 1 | — |
| CT04.1 | Buscar por matéria, nível e modalidade | RF07 | Integração | Resultados atendem aos filtros informados | ✅ Aprovado | 1 | — |
| CT04.2 | Buscar sem correspondências e com parâmetros inválidos | RF07 | Integração | Lista vazia; parâmetros inválidos recusados | ✅ Aprovado | 1 | — |
| CT04.3 | Consultar perfil com grade, bloqueio e aula confirmada | RF08 | Unitário e integração | Apenas horários realmente livres | ✅ Aprovado | 1 | — |
| CT04.4 | Consultar professor inexistente, inativo ou com perfil incompleto | RF08 | Integração | Professor não exposto; resposta 404 | ✅ Aprovado | 1 | — |
| CT04.5 | Solicitar aula omitindo professor, matéria, modalidade ou horário (o objetivo é opcional) | RF09 | Integração | Pedido incompleto recusado e nenhuma aula criada | ✅ Aprovado | 1 | — |
| CT04.6 | Solicitar no passado, fora da grade, com intervalo invertido e com duração fora de 30 a 240 minutos | RF09 | Unitário e integração | Pedido recusado | ✅ Aprovado | 1 | — |
| CT04.7 | Solicitar matéria ou modalidade não oferecida pelo professor | RF09 | Integração | Pedido recusado sem criar aula | ✅ Aprovado | 1 | — |
| CT04.8 | Solicitar aula sem token ou com perfil de professor | RF09, RF10 | Integração | Acesso negado | ✅ Aprovado | 1 | — |
| CT04.9 | Solicitar série semanal válida | RF10 | Unitário e integração | Ocorrências semanais no mesmo horário, com `serieId` comum e uma única notificação | ✅ Aprovado | 1 | — |
| CT04.10 | Solicitar série com uma semana indisponível | RF10 | Integração | Série recusada inteira; nada é criado | ✅ Aprovado | 1 | — |
| CT04.11 | Informar quantidade de semanas fora de 2 a 12 | RF10 | Integração | Validação recusa a série | ✅ Aprovado | 1 | — |
| CT04.12 | Percorrer páginas de uma busca | RF07 | Integração | Paginação informa total e página | ✅ Aprovado | 1 | — |

**Legenda:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado

**Testes que comprovam cada caso**

| Caso | Teste automatizado |
|---|---|
| CT04 | Playwright: "CT04 — aluno solicita aula em horário livre e o professor é avisado"; integração `aulas.test.ts`: "cria a aula como SOLICITADA, grava histórico e notifica o professor" |
| CT04.1 | Integração `usuarios.test.ts`: "filtra por matéria, nível e modalidade" |
| CT04.2 | Integração: "filtra por matéria, nível e modalidade" (total 0 sem correspondência) e "pagina o resultado e valida os parâmetros" |
| CT04.3 | Integração: "devolve perfil e horários livres das próximas semanas sem dados de contato" e "remove o horário confirmado da lista de horários livres"; unitário: "desconta bloqueios e aulas ocupadas da grade semanal" |
| CT04.4 | Integração: "responde 404 para perfil incompleto ou inexistente e 422 para id inválido", "não lista professor bloqueado pelo administrador" e "responde 404 para professor inexistente ou bloqueado" |
| CT04.5 | Integração `aulas.test.ts`: "recusa pedido sem professor, matéria, modalidade ou horário e não cria aula (CT04.5)" |
| CT04.6 | Integração: "rejeita aula no passado com 400 e dados inválidos com 422", "responde 409 quando o horário está fora da grade ou bloqueado" e "recusa aula com menos de 30 minutos e aceita exatamente 30 (CT04.6)" |
| CT04.7 | Integração: "rejeita matéria ou modalidade que o professor não oferece com 400" |
| CT04.8 | Integração: "exige login e perfil de aluno" |
| CT04.9 | Integração: "cria uma série semanal com o mesmo serieId e notifica o professor uma vez" (3 semanas); unitário equivalente |
| CT04.10 | Integração: "não cria nada quando uma das semanas está indisponível" |
| CT04.11 | Integração: "valida a quantidade de semanas com 422" (1 e 13 semanas) |
| CT04.12 | Integração: "pagina o resultado e valida os parâmetros" |

## 4. Execuções

Registre cada execução abaixo, da mais recente para a mais antiga.

### Execução 1 — 14/11/2026

| Campo | Valor |
|---|---|
| Responsável | Pedro França |
| Branch / commit | Branch `test/casos-pendentes-do-roteiro`: código do commit `a6b0102` da `developer` mais os testes complementares desta branch |
| Motivo | Última execução dos testes automatizados das Sprints 3 e 4 (`npm run testes`, às 13h47) |
| Casos executados | CT04, CT04.1 a CT04.12 |

| Caso | Observado | Status |
|---|---|---|
| CT04 | Pedido criado como "solicitada"; o professor recebeu a notificação no sino | ✅ |
| CT04.1 e CT04.2 | Filtros respeitados; total 0 sem correspondência; parâmetros inválidos recusados | ✅ |
| CT04.3 | Horários livres sem o intervalo bloqueado e sem a aula confirmada | ✅ |
| CT04.4 | Inexistente e incompleto com 404; inativo fora da busca e recusado na solicitação | ✅ |
| CT04.5 | Pedido sem professor, matéria, modalidade, início ou fim recusado com 422; nenhuma aula criada | ✅ |
| CT04.6 | Passado (400), fora da grade (409), intervalo invertido, 20 e 600 minutos (422) recusados; 30 minutos aceito | ✅ |
| CT04.7 e CT04.8 | Matéria ou modalidade não oferecida recusada; visitante e professor não solicitam | ✅ |
| CT04.9 a CT04.11 | Série de 3 semanas criada com o mesmo `serieId`; série com semana ocupada não criada; 1 e 13 semanas recusadas | ✅ |
| CT04.12 | Paginação com total e página corretos | ✅ |

Saída dos testes automatizados (`npm run testes`, na raiz):

```text
Back-end — testes de integração:
  ✓ tests/integration/aulas.test.ts (27 tests)
  ✓ tests/integration/usuarios.test.ts (12 tests)
  73 de 73 aprovados
Sistema (Playwright):
  ok 6 › CT04 — aluno solicita aula em horário livre e o professor é avisado (4.6s)
```

Evidências: [relatório de testes](../assets/qualidade/relatorio-de-testes/index.html) e [relatório do Playwright](../assets/qualidade/relatorio-de-testes/e2e/2026-11-14_13-50-04/html/index.html).

**Resultado:** 13 casos executados, 13 aprovados.

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito encontrado | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!--
### DEF-C03-nn — Título do defeito

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
| `backend/src/modules/aulas/aulas.service.ts` | 100% | 96,9% | Solicitação e séries semanais |
| `backend/src/modules/usuarios/usuarios.service.ts` | 100% | 94,7% | Busca e perfil público |
| `frontend/src/pages/professores.tsx` | 97,4% | 95,8% | Busca |
| `frontend/src/pages/professor.tsx` | 100% | 92,5% | Perfil público e horários livres |
| `frontend/src/pages/solicitar-aula.tsx` | 96,1% | 90,2% | Solicitação, inclusive semanal |

## 7. Parecer final

**Situação:** ✅ Aprovado

Os critérios de RF07, RF08, RF09 e RF10 estão comprovados por testes de integração e de sistema, todos aprovados na execução de 14/11/2026, e a cobertura está acima da meta M6. Não houve defeitos.

## 8. Contribuições

| Integrante | Pontos de contribuição |
|---|---|
| Pedro Rodrigues | A preencher |
| Yasmim Ayres | A preencher |
| **Total** | **100** |
