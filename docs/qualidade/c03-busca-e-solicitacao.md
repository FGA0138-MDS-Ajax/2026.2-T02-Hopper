# C03 — Busca de professores e solicitação de aula

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
| Cenário | C03 — Busca de professores e solicitação de aula |
| Requisitos | RF07 Buscar professores (Must) · RF08 Visualizar perfil e horários livres (Must) · RF09 Solicitar aula (Must) · RF10 Solicitar aulas recorrentes (Could) |
| Histórias de usuário | **RF07:** US07 – Como aluno, quero buscar professores por matéria, nível e modalidade, para encontrar quem atende minha necessidade.<br>**RF08:** US08 – Como aluno, quero ver os horários livres do professor, para escolher um sem precisar perguntar.<br>**RF09:** US09 – Como aluno, quero solicitar uma aula informando meu objetivo, para que o professor tenha o que precisa para aceitar.<br>**RF10:** US10 – Como aluno, quero marcar aulas semanais de uma vez, para não repetir o pedido toda semana. |
| Casos do roteiro | CT04 (Documento de Visão, seção 6.2) |
| Sprint | 4 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

Código consultado: módulos `usuarios`, `agenda` e `aulas`. Rotas sob `/api/v1`: `GET /professores`, `GET /professores/:id` e `POST /aulas`. O nível vem da matéria referenciada por `materiaId`; a solicitação usa `professorId`, `materiaId`, `inicio`, `fim`, `modalidade`, `objetivo` e, quando recorrente, `recorrencia.semanas`. O código aceita de 2 a 12 semanas. A leitura do código orienta a preparação dos testes, sem substituir o resultado esperado do Documento de Visão.

Fontes: [Documento de Visão](../documento-de-visao.md), Quadros 3, 13, 14, 18, 20 e 21; [Documento de Arquitetura](../documento-de-arquitetura.md).

## 2. Critérios de aceitação testáveis

- [ ] **RF07** — A busca combina filtros por matéria, nível e modalidade e retorna apenas professores compatíveis — CT04.1
- [ ] **RF07** — Busca sem correspondências retorna lista vazia; filtros inválidos são recusados; paginação mantém resultados coerentes — CT04.2, CT04.12
- [ ] **RF08** — O perfil apresenta os horários realmente livres, excluindo bloqueios e aulas que ocupam o horário — CT04.3
- [ ] **RF08** — Perfil inexistente, inativo ou incompleto não é exposto como professor disponível — CT04.4
- [ ] **RF09** — Aluno envia pedido com matéria, nível associado, modalidade, horário e objetivo e o professor é notificado — CT04
- [ ] **RF09** — Dados obrigatórios ausentes, horário inválido e matéria/modalidade não oferecidas são recusados sem criar aula — CT04.5, CT04.6, CT04.7
- [ ] **RF09 / RF10** — Somente aluno autenticado pode solicitar aula ou série recorrente — CT04.8
- [ ] **RF10** — Pedido semanal cria as ocorrências no mesmo horário semanal e com identificação comum da série — CT04.9
- [ ] **RF10** — Se uma ocorrência estiver indisponível ou a quantidade de semanas for inválida, a série não é criada parcialmente — CT04.10, CT04.11

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT04 | Verificar o envio do pedido (RF09) | RF09 | Sistema | Pedido criado com status "solicitada" e professor notificado | ⚪ Pendente | 0 | — |
| CT04.1 | Buscar por matéria, nível e modalidade, isoladamente e combinados | RF07 | Integração | Resultados atendem a todos os filtros informados | ⚪ Pendente | 0 | — |
| CT04.2 | Buscar sem correspondências e enviar modalidade ou paginação inválida | RF07 | Integração | Busca válida sem correspondências retorna lista vazia; parâmetros inválidos são recusados | ⚪ Pendente | 0 | — |
| CT04.3 | Consultar perfil com grade, bloqueio pontual e aula confirmada | RF08 | Integração | Perfil retorna apenas horários realmente livres, sem intervalos bloqueados ou ocupados | ⚪ Pendente | 0 | — |
| CT04.4 | Consultar professor inexistente, inativo ou com perfil incompleto | RF08 | Integração | Perfil não é disponibilizado; resposta informa que o professor não foi encontrado | ⚪ Pendente | 0 | — |
| CT04.5 | Solicitar aula omitindo, em variações, professor, matéria, modalidade, horário ou objetivo | RF09 | Integração | Pedido incompleto recusado e nenhuma aula criada; o nível é identificado pela matéria escolhida | ⚪ Pendente | 0 | — |
| CT04.6 | Solicitar no passado, fora da grade ou com intervalo inválido; conferir limites de 30 e 240 minutos | RF09 | Unitário e integração | Passado, ausência de disponibilidade e duração fora de 30–240 minutos recusados; limites válidos aceitos se o horário estiver livre | ⚪ Pendente | 0 | — |
| CT04.7 | Solicitar matéria ou modalidade não oferecida pelo professor | RF09 | Integração | Pedido recusado sem persistência de aula ou notificação de solicitação | ⚪ Pendente | 0 | — |
| CT04.8 | Solicitar aula ou série sem token ou com perfil PROFESSOR | RF09, RF10 | Integração | Acesso negado e nenhuma ocorrência criada | ⚪ Pendente | 0 | — |
| CT04.9 | Solicitar séries válidas de 2 e de 12 semanas | RF10 | Integração | Ocorrências criadas semanalmente no mesmo horário, com serieId comum e sem criação duplicada dentro da operação | ⚪ Pendente | 0 | — |
| CT04.10 | Solicitar série com uma ocorrência fora da disponibilidade | RF10 | Integração | Série recusada integralmente; nenhuma ocorrência ou notificação parcial persistida | ⚪ Pendente | 0 | — |
| CT04.11 | Informar recorrencia.semanas igual a 1, 13 ou valor não inteiro | RF10 | Integração | Validação recusa a série e nenhuma ocorrência é criada | ⚪ Pendente | 0 | — |
| CT04.12 | Percorrer páginas de uma busca com mais resultados que o limite | RF07 | Integração | Paginação informa total e página e permite percorrer resultados sem perda ou repetição decorrente da ordenação | ⚪ Pendente | 0 | — |

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

Evidências dos testes pela interface: A preencher (capturas em `docs/assets/qualidade/c03/`).

**Resultado:** A preencher (ex.: 11 executados, 10 aprovados, 1 falhou).

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito registrado até o momento | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!-- Para cada defeito, copie o bloco abaixo. -->

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
