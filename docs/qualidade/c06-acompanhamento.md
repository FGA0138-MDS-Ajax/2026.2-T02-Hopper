# C06 — Acompanhamento das aulas

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
| Cenário | C06 — Acompanhamento das aulas |
| Requisitos | RF17 Acompanhar status da aula (Must) · RF18 Consultar histórico de aulas (Should) · RF19 Enviar lembrete (Should) · RF20 Registrar anotações da aula (Could) · RF21 Avaliar aula realizada (Could) |
| Histórias de usuário | **RF17:** US17 – Como aluno, quero ver o status das minhas aulas, para saber sempre em que pé estão.<br>**RF18:** US18 – Como aluno ou responsável, quero consultar o histórico, para acompanhar a frequência das aulas.<br>**RF19:** US19 – Como aluno ou professor, quero receber um lembrete, para não esquecer a aula.<br>**RF20:** US20 – Como professor, quero registrar o que foi visto, para planejar a próxima aula.<br>**RF21:** US21 – Como aluno, quero avaliar a aula, para ajudar outros alunos a escolher. |
| Casos do roteiro | CT10 (Documento de Visão, seção 6.2) |
| Sprint | 5 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

Código consultado: `GET /api/v1/aulas` (status, período e paginação), `GET /api/v1/aulas/:id` (detalhe e histórico) e módulo `notificacoes`. O CT10 deve usar dados preparados nos seis status do requisito; a existência da listagem não comprova os fluxos que produzem cada status. **RF19, RF20 e RF21 — Funcionalidade ainda não implementada:** não foi localizada geração de lembretes no serviço de notificações, nem operações de serviço/rotas para gravar anotações ou avaliações. O enum LEMBRETE e os campos/tabelas do Prisma não bastam para considerar esses fluxos implementados. Os seis casos correspondentes ficam bloqueados.

Fontes: [Documento de Visão](../documento-de-visao.md), Quadros 3, 13, 14, 18, 20 e 21; [Documento de Arquitetura](../documento-de-arquitetura.md).

## 2. Critérios de aceitação testáveis

- [ ] **RF17** — Aluno consulta suas aulas nos status solicitada, confirmada, recusada, remarcada, cancelada e realizada — CT10, CT10.1
- [ ] **RF18** — Histórico mostra aulas passadas e futuras, com filtros e sequência de mudanças de status — CT10, CT10.1, CT10.2
- [ ] **RF17 / RF18** — Consultas e paginação mostram apenas aulas do participante; filtros e intervalos inválidos são recusados — CT10.3, CT10.4
- [ ] **RF19** — Aluno e professor veem na aplicação lembrete de aula confirmada nas próximas 24 h, sem avisar aula fora da janela ou em outro status — CT10.5
- [ ] **RF19** — Acessos repetidos não duplicam o lembrete da mesma aula para o mesmo destinatário — CT10.6
- [ ] **RF20** — Professor da aula registra conteúdo e observações e o aluno participante pode consultá-los — CT10.7
- [ ] **RF20** — Aluno e professor de outra aula não alteram as anotações — CT10.8
- [ ] **RF21** — Aluno participante registra nota e comentário após a aula realizada — CT10.9
- [ ] **RF21** — Avaliação antes da realização, por terceiro ou duplicada é recusada — CT10.10

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT10 | Verificar a exibição do status e do histórico (RF17, RF18) | RF17, RF18 | Sistema | Todas as aulas listadas com o status correto | ⚪ Pendente | 0 | — |
| CT10.1 | Filtrar aulas por cada status e por períodos passados e futuros | RF17, RF18 | Integração | Somente aulas do usuário compatíveis com status e período informados são listadas | ⚪ Pendente | 0 | — |
| CT10.2 | Consultar detalhe de aula com mudanças de status registradas | RF17, RF18 | Integração | Detalhe retorna o status atual e histórico cronológico das transições, com data e motivo quando aplicável | ⚪ Pendente | 0 | — |
| CT10.3 | Paginar aulas e tentar detalhar aula de outros usuários como aluno e professor | RF17, RF18 | Integração | Paginação mantém isolamento por participante e acesso a detalhe de terceiros é negado | ⚪ Pendente | 0 | — |
| CT10.4 | Consultar status inexistente, intervalo de datas invertido ou paginação inválida | RF17, RF18 | Integração | Consulta recusada com validação clara, sem expor dados de terceiros | ⚪ Pendente | 0 | — |
| CT10.5 | Acessar a aplicação como aluno e professor com aulas confirmadas dentro e fora das próximas 24 h<br>**Observação:** Funcionalidade ainda não implementada | RF19 | Sistema | Lembrete exibido apenas para aula confirmada na janela das próximas 24 h, aos participantes correspondentes | ⛔ Bloqueado | 0 | — |
| CT10.6 | Acessar repetidamente a aplicação dentro da janela de lembrete da mesma aula<br>**Observação:** Funcionalidade ainda não implementada | RF19 | Integração | Um único lembrete por aula e destinatário, sem duplicações por acesso | ⛔ Bloqueado | 0 | — |
| CT10.7 | Professor registra conteúdo e observações e aluno consulta a mesma aula<br>**Observação:** Funcionalidade ainda não implementada | RF20 | Sistema | Anotações persistidas e visíveis ao aluno participante | ⛔ Bloqueado | 0 | — |
| CT10.8 | Aluno ou outro professor tenta alterar anotações da aula<br>**Observação:** Funcionalidade ainda não implementada | RF20 | Integração | Acesso negado e anotações originais preservadas | ⛔ Bloqueado | 0 | — |
| CT10.9 | Aluno participante avalia aula realizada com nota e comentário<br>**Observação:** Funcionalidade ainda não implementada | RF21 | Sistema | Avaliação registrada e associada à aula realizada | ⛔ Bloqueado | 0 | — |
| CT10.10 | Avaliar aula não realizada, aula de outro aluno ou uma aula já avaliada<br>**Observação:** Funcionalidade ainda não implementada | RF21 | Integração | Avaliação inválida recusada sem criar registro indevido ou duplicado | ⛔ Bloqueado | 0 | — |

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

Evidências dos testes pela interface: A preencher (capturas em `docs/assets/qualidade/c06/`).

**Resultado:** A preencher (ex.: 11 executados, 10 aprovados, 1 falhou).

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito registrado até o momento | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!-- Para cada defeito, copie o bloco abaixo. -->

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
