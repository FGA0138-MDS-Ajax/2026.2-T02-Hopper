# C02 — Perfil e disponibilidade do professor

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
| Cenário | C02 — Perfil e disponibilidade do professor |
| Requisitos | RF04 Manter perfil do professor (Must) · RF05 Publicar disponibilidade (Must) · RF06 Bloquear horários pontuais (Should) |
| Histórias de usuário | US04, US05, US06 |
| Casos do roteiro | CT03 (Documento de Visão, seção 6.2) |
| Sprint | 3 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

Rotas sob `/api/v1`: `GET/PUT /professores/me`, `GET/PUT /professores/me/disponibilidade`, `GET/POST /professores/me/bloqueios` e `DELETE /professores/me/bloqueios/:id` (Documento de Arquitetura, Quadro 2).

## 2. Critérios de aceitação testáveis

- [x] **RF04** — Professor salva e consulta matérias com seus níveis, modalidades, valor da hora-aula e apresentação — CT03.5
- [x] **RF04** — Matéria inexistente, valor negativo e campos obrigatórios vazios são recusados — CT03.6
- [x] **RF04 / RF05 / RF06** — Visitante e aluno não alteram perfil, grade nem bloqueios — CT03.7
- [x] **RF05** — A grade semanal publicada aparece como horários livres no perfil público — CT03
- [x] **RF05** — Faixas sobrepostas no mesmo dia são recusadas — CT03.8
- [x] **RF05** — A publicação de uma grade vazia remove a disponibilidade anterior — CT03.9
- [x] **RF06** — Um bloqueio pontual é gravado e retira o intervalo dos horários livres — CT03.10
- [x] **RF06** — A remoção do bloqueio devolve o intervalo aos horários livres — CT03.11
- [x] **RF06** — Bloqueios no passado, com intervalo inválido ou de outro professor não são criados nem removidos — CT03.12, CT03.13

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT03 | Publicar a grade semanal | RF05 | Sistema | Horários exibidos no perfil público do professor | ✅ Aprovado | 1 | — |
| CT03.5 | Salvar e consultar perfil completo | RF04 | Integração | Matérias, modalidades, valor e apresentação gravados e devolvidos; perfil passa a completo | ✅ Aprovado | 1 | — |
| CT03.6 | Enviar perfil com matéria inexistente, valor negativo ou campos vazios | RF04 | Integração | Requisição recusada com indicação da validação | ✅ Aprovado | 1 | — |
| CT03.7 | Acessar perfil, grade e bloqueios sem token e com perfil de aluno | RF04, RF05, RF06 | Integração | Acesso negado | ✅ Aprovado | 1 | — |
| CT03.8 | Substituir a grade por faixas sobrepostas no mesmo dia | RF05 | Unitário e integração | Sobreposição recusada | ✅ Aprovado | 1 | — |
| CT03.9 | Substituir a grade por uma grade vazia e consultar o perfil público | RF05 | Integração | Nenhum horário livre exibido | ✅ Aprovado | 1 | — |
| CT03.10 | Criar bloqueio futuro e consultar horários livres | RF06 | Unitário e integração | Bloqueio gravado e intervalo excluído dos horários livres | ✅ Aprovado | 1 | — |
| CT03.11 | Remover um bloqueio próprio e consultar os horários livres | RF06 | Integração | Intervalo volta aos horários livres, se não houver aula ocupando | ✅ Aprovado | 1 | — |
| CT03.12 | Criar bloqueio no passado ou com início igual ou posterior ao fim | RF06 | Unitário e integração | Bloqueio recusado | ✅ Aprovado | 1 | — |
| CT03.13 | Remover por ID o bloqueio de outro professor | RF06 | Integração | Acesso negado e bloqueio preservado | ✅ Aprovado | 1 | — |

**Legenda:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado

**Testes que comprovam cada caso**

| Caso | Teste automatizado |
|---|---|
| CT03 | Playwright: "CT03 — professor publica a grade semanal e os horários aparecem no perfil público"; componente `meu-perfil.test.tsx`: "monta a grade, repete nos dias úteis e salva" |
| CT03.5 | Integração `usuarios.test.ts`: "começa incompleto e passa a completo depois de preenchido" |
| CT03.6 | Integração: "rejeita matéria inexistente com 422 e payload inválido com 422" (inclui valor −1 e campos vazios) |
| CT03.7 | Integração `agenda.test.ts`: "nega a aluno e a visitante o acesso aos bloqueios (CT03.7)"; perfil e grade: "bloqueia aluno com 403 e visitante com 401" (`usuarios.test.ts` e `agenda.test.ts`) |
| CT03.8 | Unitário `agenda.service.test.ts`: "rejeita faixas sobrepostas no mesmo dia com 400"; integração `agenda.test.ts`: "rejeita faixas sobrepostas com 400 e faixa inválida com 422" |
| CT03.9 | Integração: "publicar a grade vazia remove os horários livres do perfil público (CT03.9)"; componente: aviso de grade salva sem horários |
| CT03.10 | Integração: "cria, lista e remove bloqueio"; unitário: "desconta bloqueios e aulas ocupadas da grade semanal" |
| CT03.11 | Integração: "ao remover um bloqueio, o horário volta a ficar livre (CT03.11)" |
| CT03.12 | Integração: "rejeita bloqueio no passado e intervalo invertido"; unitário: "rejeita bloqueio que começa no passado" |
| CT03.13 | Integração: "impede remover bloqueio de outro professor e responde 404 para id inexistente" |

## 4. Execuções

Registre cada execução abaixo, da mais recente para a mais antiga.

### Execução 1 — 14/11/2026

| Campo | Valor |
|---|---|
| Responsável | Pedro França |
| Branch / commit | Branch `test/casos-pendentes-do-roteiro`: código do commit `a6b0102` da `developer` mais os testes complementares desta branch |
| Motivo | Última execução dos testes automatizados das Sprints 3 e 4 (`npm run testes`, às 13h47) |
| Casos executados | CT03, CT03.5 a CT03.13 |

| Caso | Observado | Status |
|---|---|---|
| CT03 | Grade de segunda-feira publicada e horários exibidos no perfil público | ✅ |
| CT03.5 | Perfil passou de incompleto a completo, com os dados devolvidos | ✅ |
| CT03.6 | Matéria inexistente e dados inválidos recusados com 422 | ✅ |
| CT03.7 | Aluno recebeu 403 e visitante 401 em perfil, grade e bloqueios | ✅ |
| CT03.8 | Faixas sobrepostas recusadas com 400 | ✅ |
| CT03.9 | Com a grade vazia, o perfil público passou a ter zero horários livres | ✅ |
| CT03.10 | Bloqueio criado e listado; o cálculo dos horários livres desconta o bloqueio | ✅ |
| CT03.11 | O horário bloqueado sumiu dos horários livres e voltou depois da remoção | ✅ |
| CT03.12 | Bloqueio no passado recusado com 400 e intervalo invertido com 422 | ✅ |
| CT03.13 | Remoção de bloqueio alheio recusada com 403 | ✅ |

Saída dos testes automatizados (`npm run testes`, na raiz):

```text
Back-end — testes de integração:
  ✓ tests/integration/agenda.test.ts (9 tests)
  ✓ tests/integration/usuarios.test.ts (12 tests)
  73 de 73 aprovados
Sistema (Playwright):
  ok 5 › CT03 — professor publica a grade semanal e os horários aparecem no perfil público (2.9s)
```

Evidências: [relatório de testes](../assets/qualidade/relatorio-de-testes/index.html) e [relatório do Playwright](../assets/qualidade/relatorio-de-testes/e2e/2026-11-14_13-50-04/html/index.html).

**Resultado:** 10 casos executados, 10 aprovados.

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito encontrado | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!--
### DEF-C02-nn — Título do defeito

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
| `backend/src/modules/agenda/agenda.service.ts` | 91,2% | 95,0% | Grade, bloqueios e horários livres |
| `backend/src/modules/usuarios/usuarios.service.ts` | 100% | 94,7% | Perfil do professor |
| `frontend/src/components/area-professor/editor-grade.tsx` | 100% | 86,7% | Edição da grade |
| `frontend/src/components/area-professor/gerenciar-bloqueios.tsx` | 100% | 94,3% | Bloqueios |
| `frontend/src/components/area-professor/formulario-perfil.tsx` | 100% | 90,0% | Perfil |

## 7. Parecer final

**Situação:** ✅ Aprovado

Os critérios de RF04, RF05 e RF06 estão comprovados por testes de unidade, integração e sistema, todos aprovados na execução de 14/11/2026, e a cobertura está acima da meta M6. Não houve defeitos.

## 8. Contribuições

| Integrante | Pontos de contribuição |
|---|---|
| Pedro Rodrigues | A preencher |
| Yasmim Ayres | A preencher |
| **Total** | **100** |
