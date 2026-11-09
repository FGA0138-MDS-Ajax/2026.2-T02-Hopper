# C05 — Remarcação e cancelamento de aula

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
| Cenário | C05 — Remarcação e cancelamento de aula |
| Requisitos | RF15 Remarcar aula (Must) · RF16 Cancelar aula (Must) |
| Histórias de usuário | **RF15:** US15 – Como aluno ou professor, quero propor um novo horário, para remarcar sem trocar mensagens.<br>**RF16:** US16 – Como aluno ou professor, quero cancelar uma aula informando o motivo, para que o horário seja liberado. |
| Casos do roteiro | CT08, CT09 (Documento de Visão, seção 6.2) |
| Sprint | 5 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

**RF15 e RF16 — Funcionalidade ainda não implementada.** No snapshot da `developer`, `aulas.routes.ts` expõe solicitar, listar, detalhar, aceitar e recusar; não há rotas nem operações de serviço para propor/responder remarcação ou cancelar. Os tipos, a tabela `Remarcacao`, o campo `motivoCancelamento` e a tabela de transições de status são estruturas de suporte, não evidência de um fluxo implementado. Todos os casos desta página permanecem ⛔ Bloqueado, com 0 ciclos, até existir implementação executável.

Fontes: [Documento de Visão](../documento-de-visao.md), Quadros 3, 13, 14, 18, 20 e 21; [Documento de Arquitetura](../documento-de-arquitetura.md).

## 2. Critérios de aceitação testáveis

- [ ] **RF15** — Aluno ou professor propõe novo horário; somente a outra parte aceita a proposta, e o horário original permanece até a decisão — CT08, CT08.1
- [ ] **RF15** — Aceite libera o horário antigo, ocupa o novo e registra o status remarcada; recusa conserva o agendamento original — CT08, CT08.2
- [ ] **RF15** — Horário sobreposto, no passado ou com intervalo inválido é recusado sem duplicar reservas (M4 = 0) — CT08.3, CT08.5
- [ ] **RF15** — Terceiros não propõem nem respondem remarcações da aula — CT08.4
- [ ] **RF16** — Participante autorizado cancela com motivo registrado e o horário é liberado — CT09
- [ ] **RF16** — Cancelamento sem motivo ou por terceiro é recusado sem alterar a aula — CT09.1, CT09.2
- [ ] **RF16** — Estados não permitidos e cancelamento repetido não geram nova transição nem efeitos duplicados; aluno pode cancelar sua solicitação pendente — CT09.3, CT09.4

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT08 | Verificar a remarcação com aceite da outra parte (RF15)<br>**Observação:** Funcionalidade ainda não implementada | RF15 | Sistema | Novo horário bloqueado, antigo liberado e status "remarcada" | ⛔ Bloqueado | 0 | — |
| CT09 | Verificar o cancelamento com motivo (RF16)<br>**Observação:** Funcionalidade ainda não implementada | RF16 | Sistema | Status "cancelada", motivo registrado e horário liberado | ⛔ Bloqueado | 0 | — |
| CT08.1 | Propor remarcação como aluno e como professor, testando a decisão da outra parte<br>**Observação:** Funcionalidade ainda não implementada | RF15 | Sistema | Proposta aguarda a outra parte; proponente não aprova a própria proposta e horário original fica preservado até o aceite | ⛔ Bloqueado | 0 | — |
| CT08.2 | Recusar proposta de remarcação e consultar a aula e a agenda<br>**Observação:** Funcionalidade ainda não implementada | RF15 | Sistema | Recusa preserva o horário e o status de agendamento anteriores, sem ocupar o horário proposto | ⛔ Bloqueado | 0 | — |
| CT08.3 | Aceitar remarcação para horário ocupado, inclusive sob concorrência<br>**Observação:** Funcionalidade ainda não implementada | RF15 | Integração | Remarcação conflitante recusada; agenda original preservada e nenhuma reserva sobreposta aceita (M4 = 0) | ⛔ Bloqueado | 0 | — |
| CT08.4 | Propor ou responder remarcação de aula de outros usuários<br>**Observação:** Funcionalidade ainda não implementada | RF15 | Integração | Acesso negado e proposta/agendamento preservados | ⛔ Bloqueado | 0 | — |
| CT08.5 | Propor horário no passado ou início igual/posterior ao fim<br>**Observação:** Funcionalidade ainda não implementada | RF15 | Integração | Proposta inválida recusada sem alterar a aula | ⛔ Bloqueado | 0 | — |
| CT09.1 | Cancelar sem motivo ou com motivo vazio<br>**Observação:** Funcionalidade ainda não implementada | RF16 | Integração | Cancelamento recusado até informar motivo válido; horário original preservado | ⛔ Bloqueado | 0 | — |
| CT09.2 | Cancelar aula como usuário que não participa dela<br>**Observação:** Funcionalidade ainda não implementada | RF16 | Integração | Acesso negado e horário não liberado | ⛔ Bloqueado | 0 | — |
| CT09.3 | Repetir cancelamento ou cancelar em estado não permitido<br>**Observação:** Funcionalidade ainda não implementada | RF16 | Integração | Operação inválida recusada sem histórico, liberação ou notificações duplicados | ⛔ Bloqueado | 0 | — |
| CT09.4 | Aluno cancela sua própria solicitação ainda pendente, informando motivo<br>**Observação:** Funcionalidade ainda não implementada | RF16 | Sistema | Solicitação marcada CANCELADA com motivo registrado e sem ocupação do horário | ⛔ Bloqueado | 0 | — |

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

Evidências dos testes pela interface: A preencher (capturas em `docs/assets/qualidade/c05/`).

**Resultado:** A preencher (ex.: 11 executados, 10 aprovados, 1 falhou).

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito registrado até o momento | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!-- Para cada defeito, copie o bloco abaixo. -->

<!--
### DEF-C05-nn — Título do defeito

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
