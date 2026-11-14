# Visão Geral da Qualidade

Esta seção reúne o roteiro, as execuções, os defeitos e as correções do AulaCerta, em uma página por cenário. Cada página tem os mesmos oito blocos: identificação, critérios de aceitação, casos de teste, execuções, defeitos e correções, cobertura, parecer final e contribuições. Situação em **14/11/2026**, com base na **última execução** dos testes automatizados das Sprints 3 e 4, feita nesse dia às 13h47.

!!! success "Relatório de testes: última execução (14/11/2026)"
    409 de 409 testes automatizados aprovados: 133 unitários do back-end, 73 de integração, 194 do front-end e 9 de sistema (Playwright). O relatório reúne o log, o resultado de cada teste, a cobertura do código linha a linha e as capturas de tela do Playwright.

    [Acessar o relatório de testes](../assets/qualidade/relatorio-de-testes/index.html){ .md-button .md-button--primary }

## Situação geral

| Indicador | Valor em 14/11/2026 |
|---|---|
| Testes automatizados aprovados | 409 de 409: 133 unitários do back-end, 73 de integração, 194 do front-end e 9 de sistema |
| Casos do roteiro e complementares | 73 casos: 59 aprovados, 1 pendente e 13 bloqueados |
| Caso pendente | CT10 (status e histórico pela interface), que depende da Sprint 5 |
| Casos bloqueados | C05 (RF15 e RF16) e lembretes do C06 (RF19), previstos para a Sprint 5 |
| Defeitos encontrados no desenvolvimento | 2, ambos corrigidos e retestados na última execução ([DEF-C01-01](c01-cadastro-e-autenticacao.md#def-c01-01-usuario-nao-e-direcionado-ao-destino-certo-apos-o-cadastro) e [DEF-C04-01](c04-confirmacao-ou-recusa.md#def-c04-01-aceites-simultaneos-do-mesmo-horario-respondem-com-erro-500)) |
| M4 – Conflitos de agendamento | 0, inclusive com aceites simultâneos |
| M6 – Cobertura | Back-end (regras de negócio): 98,7% das linhas e 96,5% das ramificações · Front-end: 96,3% das linhas e 90,5% das ramificações |

**Evidências:** o [relatório de testes](../assets/qualidade/relatorio-de-testes/index.html) da última execução, de 14/11/2026 reúne o log, o relatório HTML e a cobertura de cada tipo de teste, além do relatório do Playwright com capturas de tela.

## Estratégia de testes

O planejamento segue o [Documento de Visão](../documento-de-visao/v1-1.md), seção 6 e Quadros 18 a 21, e o [Documento de Arquitetura](../documento-de-arquitetura/v1-1.md).

| Nível / tipo | Foco | Ferramentas | Responsáveis |
|---|---|---|---|
| Unitário funcional | Regras de negócio (conflitos, transições de status) e componentes da interface | Vitest; React Testing Library no front-end | Desenvolvedores |
| Integração funcional | API com banco de dados de teste separado | Vitest e Supertest | Desenvolvedores back-end |
| Sistema funcional (ponta a ponta) | Fluxos de C01 a C04 pela interface, como aluno e professor | Playwright | Analista de Qualidade |
| Sistema não funcional: responsividade (RNF02) | Telas em 360 px, sem rolagem horizontal (CT12) | Playwright | Analista de Qualidade |
| Integração não funcional: segurança (RNF03) e privacidade (RNF06) | Hash de senha, acesso por JWT, consentimento e contato liberado só após a confirmação (CT13, CT14) | Vitest e Supertest | Desenvolvedores back-end e Analista de Qualidade |
| Validação pelo P.O. | Critérios de aceite de cada história | Demonstração na revisão da sprint | P.O. |

**Como executar:** na raiz do repositório, `npm run testes` roda os quatro tipos em sequência (ou `npm run testes:backend`, `testes:integracao`, `testes:frontend` e `testes:sistema`). Cada execução grava, em `relatorios/<tipo>/<data e hora>/`, o log, o relatório HTML e, quando há, a cobertura; `relatorios/index.html` reúne todas as execuções. Os testes de integração e de sistema usam um banco de teste separado, apagado a cada execução.

**M6 ≥ 70%:** no mínimo 70% em instruções, ramificações, funções e linhas, medidos pelo Vitest; no back-end, nos serviços de domínio (`src/modules/**/*.service.ts`); no front-end, em todo o `src`, exceto os testes. Abaixo disso, o comando de cobertura falha.

Conforme o Quadro 3 do Documento de Visão, Pedro Rodrigues é responsável por QA, com participação de Yasmim Ayres; Pedro França atua como P.O.

### Ambientes

| Ambiente | Branch | Verificações |
|---|---|---|
| Local | `feature/*`, `fix/*` e `test/*` | Lint, unitários, integração, cobertura e ponta a ponta antes do pull request |
| Integração | `developer` | Suíte completa e validação dos critérios de aceite pelo P.O. |
| Produção | `main` | Teste de fumaça dos fluxos principais, após a publicação |

### Métricas

As definições estão no Quadro 17 do Documento de Visão.

| Métrica | Meta | Medido em 14/11/2026 |
|---|---|---|
| M4 – Conflitos de agendamento | 0 | 0 |
| M5 – Taxa de conclusão da sprint | ≥ 80% | Calculada pelo Scrum Master no GitHub Projects |
| M6 – Cobertura de testes | ≥ 70% | 98,7% (back-end) e 96,3% (front-end), em linhas |
| M7 – Densidade de defeitos | ≤ 0,5 por história | 2 defeitos nas Sprints 3 e 4 |
| M8 – Débito técnico aberto | Estável ou em queda | Acompanhado pelo Scrum Master no GitHub |
| MN1 – Taxa de confirmação dos pedidos | ≥ 50% (hipótese) | Medida com dados de teste ao fim da Sprint 5 |
| MN2 – Tempo até a confirmação | ≤ 24 h (hipótese) | Medida com dados de teste ao fim da Sprint 5 |

## Roteiro consolidado

| Caso | Nome no roteiro (Quadro 20) | Cenário | Situação | Ciclos |
|---|---|---|---|---|
| [CT01](c01-cadastro-e-autenticacao.md) | Cadastro de usuário | C01 | ✅ Aprovado | 1 |
| [CT02](c01-cadastro-e-autenticacao.md) | Login inválido | C01 | ✅ Aprovado | 1 |
| [CT03](c02-perfil-e-disponibilidade.md) | Publicar disponibilidade | C02 | ✅ Aprovado | 1 |
| [CT04](c03-busca-e-solicitacao.md) | Solicitar aula em horário livre | C03 | ✅ Aprovado | 1 |
| [CT05](c04-confirmacao-ou-recusa.md) | Impedir conflito de horário | C04 | ✅ Aprovado | 1 |
| [CT06](c04-confirmacao-ou-recusa.md) | Aceitar solicitação | C04 | ✅ Aprovado | 1 |
| [CT07](c04-confirmacao-ou-recusa.md) | Recusar solicitação | C04 | ✅ Aprovado | 1 |
| [CT08](c05-remarcacao-e-cancelamento.md) | Remarcar aula | C05 | ⛔ Bloqueado (Sprint 5) | 0 |
| [CT09](c05-remarcacao-e-cancelamento.md) | Cancelar aula | C05 | ⛔ Bloqueado (Sprint 5) | 0 |
| [CT10](c06-acompanhamento.md) | Status e histórico | C06 | ⚪ Pendente (Sprint 5) | 0 |
| [CT12](requisitos-nao-funcionais.md) | Responsividade | RNF02 | ✅ Aprovado | 1 |
| [CT13](c01-cadastro-e-autenticacao.md) | Armazenamento de senha | RNF03 | ✅ Aprovado | 1 |
| [CT14](requisitos-nao-funcionais.md) | Privacidade dos dados | RNF06 | ✅ Aprovado | 1 |

A numeração não é contínua porque o CT11 (usabilidade) saiu do roteiro, e o CT14 passou a verificar a privacidade na versão 1.1 do Documento de Visão.

## Páginas por cenário

| Página | Requisitos | Casos | Aprovados | Pendentes | Bloqueados | Parecer |
|---|---|---|---|---|---|---|
| [C01 — Cadastro e autenticação](c01-cadastro-e-autenticacao.md) | RF01, RF02, RF03, RNF03 | 11 | 11 | 0 | 0 | ✅ Aprovado |
| [C02 — Perfil e disponibilidade](c02-perfil-e-disponibilidade.md) | RF04, RF05, RF06 | 10 | 10 | 0 | 0 | ✅ Aprovado |
| [C03 — Busca e solicitação](c03-busca-e-solicitacao.md) | RF07, RF08, RF09, RF10 | 13 | 13 | 0 | 0 | ✅ Aprovado |
| [C04 — Confirmação ou recusa](c04-confirmacao-ou-recusa.md) | RF11, RF12, RF13 | 15 | 15 | 0 | 0 | ✅ Aprovado |
| [C05 — Remarcação e cancelamento](c05-remarcacao-e-cancelamento.md) | RF15, RF16 | 11 | 0 | 0 | 11 | ⛔ Bloqueado (Sprint 5) |
| [C06 — Acompanhamento](c06-acompanhamento.md) | RF17, RF18, RF19 | 7 | 4 | 1 | 2 | ⚪ Pendente (Sprint 5) |
| [Requisitos não funcionais](requisitos-nao-funcionais.md) | RNF02, RNF06 | 6 | 6 | 0 | 0 | ✅ Aprovado |

**Fora do escopo do semestre:** administração da plataforma (C07, RF22), anotações (RF20) e avaliação de aulas (RF21), conforme o Quadro 9 do Documento de Visão. O RF14 (notificações por e-mail) já havia sido retirado.

## Bloqueios de implementação

| Página | Casos bloqueados | Motivo |
|---|---|---|
| [C05](c05-remarcacao-e-cancelamento.md) | CT08, CT08.1 a CT08.5; CT09, CT09.1 a CT09.4 | Remarcação (RF15) e cancelamento (RF16) ainda não implementados; previstos para a Sprint 5 |
| [C06](c06-acompanhamento.md) | CT10.5, CT10.6 | Lembretes (RF19) ainda não implementados; previstos para a Sprint 5 |

## Convenções de registro

- **CTxx:** caso do roteiro oficial (Quadro 20 do Documento de Visão).
- **CTxx.y:** caso complementar, com sufixo numérico e requisito identificado. Os complementares do C02 começam em CT03.5 porque CT03.1 a CT03.4 são do RF03, no C01.
- **DEF-Cnn-nn:** defeito vinculado ao cenário e a uma execução real. Para requisitos não funcionais, usar o cenário em que o defeito foi observado e referenciar o caso.
- **Branch de correção:** `fix/<descricao>`; **commit:** `fix(<modulo>): <descricao>`, com o módulo do código alterado (`auth`, `usuarios`, `agenda`, `aulas`, `notificacoes` ou `frontend`).
- **Registro único:** execuções na seção 4; defeitos, causa, branch, PR e reteste na seção 5 da mesma página.
- **Status:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado. Um caso só é aprovado quando um teste que passou verifica todo o resultado esperado; se os testes cobrem só parte, o caso fica pendente, com a observação "cobertura parcial".
- **Última execução:** vale apenas a execução completa mais recente, feita com `npm run testes` e publicada no [relatório de testes](../assets/qualidade/relatorio-de-testes/index.html); as rodadas feitas durante o desenvolvimento não são registradas. Defeitos encontrados no desenvolvimento ficam na seção 5, com causa, PR e o reteste na última execução.
- **Ciclos:** execuções oficiais até a aprovação.
