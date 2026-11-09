# Visão Geral da Qualidade

Esta seção reúne o roteiro, as execuções, os defeitos e as correções do AulaCerta em uma página por cenário. Cada página mantém os oito blocos do modelo C01. Os registros de execução, cobertura, correção e parecer aguardam evidências reais; nenhum teste do produto é apresentado como executado.

## Estratégia de testes

O planejamento segue o [Documento de Visão](../documento-de-visao.md), seção 6 e Quadros 18 a 21, e o [Documento de Arquitetura](../documento-de-arquitetura.md).

| Nível / tipo | Foco | Ferramentas | Responsabilidade prevista |
|---|---|---|---|
| Unitário funcional | Regras de negócio, conflitos e transições de status | Jest | Desenvolvedores |
| Integração funcional | API e banco: cadastro, solicitação, confirmação e remarcação | Jest e Supertest | Desenvolvedores back-end |
| Sistema funcional (ponta a ponta) | Fluxos completos como aluno e professor | Playwright | Analista de Qualidade |
| Sistema não funcional: usabilidade | Tempo, conclusão e inspeção heurística (M1 a M3) | Cenários internos de fluxo e lista de verificação heurística | Designer UX/UI |
| Sistema não funcional: responsividade, desempenho, segurança e acessibilidade | RNF02 a RNF05 | DevTools, Lighthouse e inspeção | Analista de Qualidade |
| Aceitação funcional | Critérios de aceite de cada história | Demonstração na revisão da sprint | P.O. |

**M6 ≥ 70%:** cobertura de linhas das regras de negócio, verificada no relatório do Jest antes da integração do pull request. O valor é uma meta; a cobertura efetivamente medida permanece **A preencher** nas páginas. Defeitos críticos impedem o encerramento da história.

Conforme o Quadro 3, Pedro Rodrigues é responsável por QA, com participação de Yasmim Ayres. Pedro Caldas responde por UX/UI, com Felipe Lima; Pedro França atua como P.O. Os testes unitários e de integração são responsabilidade dos desenvolvedores, com Matheus Ferraz e Daniel Valle no back-end e Juliana Pereira e Yasmim Ayres no banco.

### Ambientes previstos

| Ambiente | Branch prevista no Documento de Visão | Verificações planejadas |
|---|---|---|
| Local | `feature/*` e `fix/*` | Lint, unitários, integração e cobertura antes do pull request |
| Homologação | `develop` | Ponta a ponta, aceitação pelo P.O. e inspeção interna de usabilidade |
| Produção | `main` | Teste de fumaça dos fluxos principais |

A denominação `develop` é a do Quadro 19. Para preparar estes casos, o código foi consultado **somente por leitura** na branch `developer`, commit `2d78e346b73788a00e7b2e388c20abe6f739bf33`; isso não comprova implantação de um ambiente de homologação.

### Metas de acompanhamento

As definições de M1 a M8 estão no Quadro 17 do Documento de Visão. A arquitetura reforça a integridade da agenda (M4), a qualidade do código (M6) e o desempenho com serviço ativo. A tabela contém **metas, não resultados medidos**.

| Métrica | Meta |
|---|---|
| M1 – Tempo médio do fluxo de reserva | ≤ 3 min |
| M2 – Taxa de conclusão dos cenários de reserva | 100% |
| M3 – Conformidade da inspeção heurística | ≥ 90%, sem falhas críticas |
| M4 – Conflitos de agendamento | 0 |
| M5 – Taxa de conclusão da sprint | ≥ 80% |
| M6 – Cobertura de testes | ≥ 70% |
| M7 – Densidade de defeitos | ≤ 0,5 |
| M8 – Débito técnico aberto | Estável ou em queda |

Qualquer reserva sobreposta aceita nos testes viola **M4 = 0** e deve ser tratada como defeito crítico. O [C04](c04-confirmacao-ou-recusa.md) inclui testes de concorrência e da restrição de exclusão no banco.

## Roteiro consolidado — CT01 a CT14

O quadro registra a situação inicial do roteiro, sem execuções: todos os casos estão **⚪ Pendente**, com **0 ciclos**. Os impedimentos de implementação são discriminados nas páginas e na tabela de bloqueios abaixo; CT08 e CT09 estão bloqueados no C05.

| Caso | Nome no roteiro (Quadro 20) | Cenário | Situação inicial | Ciclos |
|---|---|---|---|---|
| [CT01](c01-cadastro-e-autenticacao.md) | Cadastro de usuário | C01 | ⚪ Pendente | 0 |
| [CT02](c01-cadastro-e-autenticacao.md) | Login inválido | C01 | ⚪ Pendente | 0 |
| [CT03](c02-perfil-e-disponibilidade.md) | Publicar disponibilidade | C02 | ⚪ Pendente | 0 |
| [CT04](c03-busca-e-solicitacao.md) | Solicitar aula em horário livre | C03 | ⚪ Pendente | 0 |
| [CT05](c04-confirmacao-ou-recusa.md) | Impedir conflito de horário | C04 | ⚪ Pendente | 0 |
| [CT06](c04-confirmacao-ou-recusa.md) | Aceitar solicitação | C04 | ⚪ Pendente | 0 |
| [CT07](c04-confirmacao-ou-recusa.md) | Recusar solicitação | C04 | ⚪ Pendente | 0 |
| [CT08](c05-remarcacao-e-cancelamento.md) | Remarcar aula | C05 | ⚪ Pendente | 0 |
| [CT09](c05-remarcacao-e-cancelamento.md) | Cancelar aula | C05 | ⚪ Pendente | 0 |
| [CT10](c06-acompanhamento.md) | Status e histórico | C06 | ⚪ Pendente | 0 |
| [CT11](requisitos-nao-funcionais.md) | Usabilidade da reserva | RNF | ⚪ Pendente | 0 |
| [CT12](requisitos-nao-funcionais.md) | Responsividade | RNF | ⚪ Pendente | 0 |
| [CT13](c01-cadastro-e-autenticacao.md) | Armazenamento de senha | C01 | ⚪ Pendente | 0 |
| [CT14](requisitos-nao-funcionais.md) | Tempo de carregamento | RNF | ⚪ Pendente | 0 |

O CT13/RNF03 pertence ao C01. Os objetivos, pré-condições e resultados esperados oficiais estão no Quadro 20 do [Documento de Visão](../documento-de-visao.md); os resultados aguardam registro conforme o Quadro 21.

## Páginas por cenário

| Página | Requisitos | Casos do roteiro | Complementares | Bloqueados |
|---|---|---|---|---|
| [C01 — Cadastro e autenticação de usuários](c01-cadastro-e-autenticacao.md) | RF01, RF02, RF03, RNF03 | 3 | 8 | 0 |
| [C02 — Perfil e disponibilidade do professor](c02-perfil-e-disponibilidade.md) | RF04, RF05, RF06 | 1 | 9 | 0 |
| [C03 — Busca de professores e solicitação de aula](c03-busca-e-solicitacao.md) | RF07, RF08, RF09, RF10 | 1 | 12 | 0 |
| [C04 — Confirmação ou recusa de aula](c04-confirmacao-ou-recusa.md) | RF11, RF12, RF13 | 3 | 12 | 0 |
| [C05 — Remarcação e cancelamento de aula](c05-remarcacao-e-cancelamento.md) | RF15, RF16 | 2 | 9 | 11 |
| [C06 — Acompanhamento das aulas](c06-acompanhamento.md) | RF17, RF18, RF19, RF20, RF21 | 1 | 10 | 6 |
| [Requisitos Não Funcionais](requisitos-nao-funcionais.md) | RNF01, RNF02, RNF04, RNF05, RNF06 | 3 | 9 | 0 |

**C07 — Administração da plataforma:** RF22, prioridade **Could**, está fora do MVP e não recebe página própria nesta seção. O RF14 foi retirado do escopo no Documento de Visão.

## Bloqueios de implementação

| Página | Casos bloqueados | Motivo e evidência na developer consultada |
|---|---|---|
| [C05](c05-remarcacao-e-cancelamento.md) | CT08, CT08.1 a CT08.5; CT09, CT09.1 a CT09.4 | **Funcionalidade ainda não implementada.** Não há rotas/operações de serviço para remarcação (RF15) e cancelamento (RF16) no módulo aulas. |
| [C06](c06-acompanhamento.md) | CT10.5, CT10.6 | **Funcionalidade ainda não implementada.** O módulo notificacoes lista e marca avisos, mas não gera lembretes de próximas aulas (RF19). |
| [C06](c06-acompanhamento.md) | CT10.7, CT10.8 | **Funcionalidade ainda não implementada.** Não há operação de gravação de anotações (RF20). |
| [C06](c06-acompanhamento.md) | CT10.9, CT10.10 | **Funcionalidade ainda não implementada.** Não há operação de registro de avaliação (RF21). |

Enums, campos e tabelas previstos no Prisma não demonstram implementação do fluxo. Bloqueio não significa falha de um teste executado: os ciclos permanecem em 0 e não há defeitos registrados por essa leitura. Os RNFs dependentes de interface e ambiente seguem pendentes, sem deduzir sua implementação a partir apenas do back-end.

## Convenções de registro

- **CTxx:** caso do roteiro oficial (CT01 a CT14).
- **CTxx.y:** caso complementar, com sufixo numérico e requisito identificado. O modelo C01 preserva CT03.1 a CT03.4 para RF03; por isso os complementares do C02 começam em CT03.5, evitando duplicidade de IDs.
- **DEF-Cnn-nn:** defeito vinculado ao cenário e a uma execução real. Para RNFs transversais, usar o cenário funcional em que o defeito foi observado e referenciar o caso RNF.
- **Branch de correção:** `fix/<issue>-<descricao>`.
- **Commit de correção:** `fix(<modulo>): <descricao> (DEF-...)`. O módulo deve corresponder ao código alterado, como `auth`, `usuarios`, `agenda`, `aulas` ou `notificacoes`.
- **Registro único:** execuções na seção 4; defeitos, causa, branch e PR de correção e reteste na seção 5 da mesma página. Não criar páginas separadas para defeitos ou correções.
- **Status:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado. Uma mudança de status exige evidência compatível; manter `A preencher` onde ainda não houver informação.
- **Ciclos:** contar execuções reais, inclusive retestes; não contar leitura do código como execução.

O [C01](c01-cadastro-e-autenticacao.md) reproduz integralmente o modelo fornecido. Nenhum bloco de execução, saída de terminal, defeito, issue, PR, cobertura ou parecer foi preenchido com resultado presumido.
