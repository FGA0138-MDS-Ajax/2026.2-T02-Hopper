# C04 — Confirmação ou recusa de aula

!!! info "Como atualizar esta página"
    1. **Ao testar:** registre a execução na seção 4 e atualize o status dos casos na seção 3.
    2. **Se um caso falhar:** marque ❌ na seção 3, abra uma issue no GitHub com o rótulo `defeito`
       e registre o defeito na seção 5, com a situação **Aberto**.
    3. **Ao corrigir:** preencha o bloco de correção do defeito na seção 5 (branch, PR e causa)
       e mude a situação para **Em reteste**.
    4. **Ao retestar:** registre uma nova execução na seção 4, volte o caso para ✅ na seção 3
       e mude o defeito para **Corrigido**.

    Registre apenas resultados de testes efetivamente executados.

## 1. Identificação

| Campo | Valor |
|---|---|
| Cenário | C04 — Confirmação ou recusa de aula |
| Requisitos | RF11 Aceitar ou recusar solicitação (Must) · RF12 Bloquear horário e impedir conflito (Must) · RF13 Notificar na plataforma (Must) |
| Histórias de usuário | **RF11:** US11 – Como professor, quero aceitar ou recusar pedidos, para controlar minha agenda.<br>**RF12:** US12 – Como professor, quero que um horário aceito fique bloqueado, para nunca marcar dois alunos juntos.<br>**RF13:** US13 – Como aluno, quero ser avisado quando o professor responder, para saber se a aula está confirmada. |
| Casos do roteiro | CT05, CT06, CT07 (Documento de Visão, seção 6.2) |
| Sprint | 4 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

Código consultado: módulos `aulas` e `notificacoes`; `PATCH /api/v1/aulas/:id/aceitar`, `PATCH /api/v1/aulas/:id/recusar` e `GET/PATCH /api/v1/notificacoes`. O serviço verifica o professor responsável e o status. O aceite revalida conflitos em transação; a migração `backend/prisma/migrations/20261101000100_restricao_sobreposicao/migration.sql` cria a exclusão `aula_sem_sobreposicao` para `CONFIRMADA` e `REMARCADA`, com intervalos `[início, fim)`. **M4 = 0**: qualquer reserva sobreposta aceita nos testes deve ser tratada como defeito crítico, sem registrar defeito antes de uma execução real. Leituras de horário antes do aceite não substituem a verificação transacional.

Fontes: [Documento de Visão](../documento-de-visao.md), Quadros 3, 13, 14, 18, 20 e 21; [Documento de Arquitetura](../documento-de-arquitetura.md).

## 2. Critérios de aceitação testáveis

- [ ] **RF11** — O professor do pedido aceita uma solicitação pendente, confirmando a aula — CT06
- [ ] **RF11** — O professor recusa uma solicitação com motivo opcional, mantendo o horário livre — CT07, CT07.1
- [ ] **RF11** — Aluno, visitante ou outro professor não decide sobre o pedido; transições repetidas ou inválidas são recusadas — CT06.1, CT06.2, CT07.2, CT07.3
- [ ] **RF12** — Pedido ou aceite sobreposto a reserva que ocupa a agenda é recusado e a contagem de reservas sobrepostas aceitas permanece zero — CT05, CT05.4
- [ ] **RF12** — Aceites simultâneos sobrepostos confirmam no máximo uma aula; a restrição no banco também impede a sobreposição — CT05.1, CT05.5
- [ ] **RF12** — Intervalos adjacentes e aulas de professores diferentes não são confundidos com conflito — CT05.2, CT05.3
- [ ] **RF13** — Aluno e professor têm os avisos na plataforma previstos para as mudanças de status, com isolamento entre usuários — CT06, CT07, CT06.3
- [ ] **RF12 / RF13** — Falha durante a operação não deixa horário confirmado sem a notificação e o histórico correspondentes — CT06.4

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT05 | Verificar o bloqueio de reservas sobrepostas (RF12) | RF12 | Unitário e integração | Pedido ou aceite recusado pelo sistema; nenhuma reserva duplicada (M4 = 0) | ⚪ Pendente | 0 | — |
| CT06 | Verificar aceite, bloqueio e notificação (RF11 a RF13) | RF11, RF12, RF13 | Sistema | Status "confirmada", horário bloqueado e aluno notificado | ⚪ Pendente | 0 | — |
| CT07 | Verificar a recusa (RF11) | RF11 | Sistema | Status "recusada", horário continua livre e aluno notificado | ⚪ Pendente | 0 | — |
| CT05.1 | Aceitar simultaneamente dois pedidos sobrepostos para o mesmo professor | RF12 | Integração | No máximo um aceite confirmado; operação concorrente recusada com conflito; nenhuma reserva sobreposta aceita (M4 = 0) | ⚪ Pendente | 0 | — |
| CT05.2 | Aceitar aulas adjacentes, com o fim da primeira igual ao início da segunda | RF12 | Unitário e integração | Ambas podem ser confirmadas se os demais critérios forem válidos; intervalos adjacentes não se sobrepõem | ⚪ Pendente | 0 | — |
| CT05.3 | Aceitar aulas simultâneas de professores diferentes | RF12 | Integração | Não há conflito entre agendas de professores diferentes | ⚪ Pendente | 0 | — |
| CT05.4 | Solicitar ou aceitar aula que se sobrepõe a uma aula CONFIRMADA ou REMARCADA | RF12 | Unitário e integração | Pedido ou aceite recusado; a reserva que ocupa o horário permanece íntegra (M4 = 0) | ⚪ Pendente | 0 | — |
| CT05.5 | Tentar persistir diretamente, em transações de teste, reservas sobrepostas para o mesmo professor | RF12 | Integração | Restrição aula_sem_sobreposicao impede persistência sobreposta em CONFIRMADA/REMARCADA, mesmo sem validação prévia do serviço | ⚪ Pendente | 0 | — |
| CT06.1 | Aceitar sem token, como aluno ou como professor que não é dono do pedido | RF11 | Integração | Acesso negado; status, agenda, histórico e notificações não alterados | ⚪ Pendente | 0 | — |
| CT06.2 | Aceitar novamente pedido já confirmado ou pedido recusado | RF11, RF12 | Integração | Transição inválida recusada e nenhuma confirmação ou notificação adicional gerada | ⚪ Pendente | 0 | — |
| CT06.3 | Consultar avisos após decisão e tentar ler ou marcar notificações de outro usuário | RF13 | Integração | Participantes recebem os avisos previstos pelo requisito; listagem e marcação afetam somente notificações do usuário autenticado | ⚪ Pendente | 0 | — |
| CT06.4 | Induzir falha controlada na gravação de histórico ou notificação durante o aceite | RF12, RF13 | Integração | Transação desfeita integralmente; nenhum bloqueio de horário, histórico ou aviso parcial persistido | ⚪ Pendente | 0 | — |
| CT07.1 | Recusar com e sem motivo e consultar o detalhe da aula | RF11 | Integração | Status RECUSADA e histórico registrados; motivo informado preservado, sem tornar o motivo obrigatório | ⚪ Pendente | 0 | — |
| CT07.2 | Recusar como visitante, aluno ou professor de outra aula | RF11 | Integração | Acesso negado e solicitação preservada | ⚪ Pendente | 0 | — |
| CT07.3 | Recusar aula já confirmada, recusada ou em outro estado não permitido | RF11 | Integração | Transição recusada, sem alterar estado nem gerar nova notificação | ⚪ Pendente | 0 | — |

**Legenda:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado

## 4. Execuções

Registre cada execução abaixo, da mais recente para a mais antiga.

<!-- Copie este bloco para cada nova execução. -->

### Execução 1 — dd/mm/2026

| Campo | Valor |
|---|---|
| Responsável | A preencher |
| Branch / commit | A preencher |
| Motivo | Primeira execução do cenário |
| Casos executados | A preencher |

| Caso | Observado | Status |
|---|---|---|
| A preencher | | |

Saída dos testes automatizados (`cd backend; npm test -- --verbose`):

```text
A preencher: colar a saída real do terminal.
```

Evidências dos testes pela interface: A preencher (capturas em `docs/assets/qualidade/c04/`).

**Resultado:** A preencher (ex.: 11 executados, 10 aprovados, 1 falhou).

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito registrado até o momento | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!-- Para cada defeito, copie o bloco abaixo. -->

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
| Branch / PR | `fix/nn-descricao` · PR #nn → `developer` |
| Causa | |
| Alteração | |
| Reteste | Execução n (dd/mm/2026) — resultado |
-->

## 6. Cobertura

Meta da métrica **M6**: cobertura das regras de negócio igual ou superior a **70%**.
Comando: `cd backend; npm test -- --coverage`

| Módulo | Cobertura de linhas | Observação |
|---|---|---|
| A preencher | | |

## 7. Parecer final

**Situação:** ⚪ Pendente

A preencher após a execução: critérios de aceitação atendidos, cobertura em relação à meta M6
e defeitos que ainda impedem a aprovação sem ressalvas.

## 8. Contribuições

| Integrante | Pontos de contribuição |
|---|---|
| Pedro Rodrigues | A preencher |
| Yasmim Ayres | A preencher |
| **Total** | **100** |
