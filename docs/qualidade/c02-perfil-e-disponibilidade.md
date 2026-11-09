# C02 — Perfil e disponibilidade do professor

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
| Cenário | C02 — Perfil e disponibilidade do professor |
| Requisitos | RF04 Manter perfil do professor (Must) · RF05 Publicar disponibilidade (Must) · RF06 Bloquear horários pontuais (Should) |
| Histórias de usuário | **RF04:** US04 – Como professor, quero descrever o que ensino e como atendo, para receber pedidos adequados.<br>**RF05:** US05 – Como professor, quero publicar meus horários livres, para não precisar informá-los a cada aluno.<br>**RF06:** US06 – Como professor, quero bloquear um horário específico, para evitar pedidos quando não posso atender. |
| Casos do roteiro | CT03 (Documento de Visão, seção 6.2) |
| Sprint | 3 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

Código consultado: módulos `usuarios` e `agenda`. Rotas sob `/api/v1`: `GET/PUT /professores/me`, `GET/PUT /professores/me/disponibilidade`, `GET/POST /professores/me/bloqueios` e `DELETE /professores/me/bloqueios/:id`. Matérias e níveis são vinculados pelo campo `materiaIds`. Os IDs CT03.1 a CT03.4 estão reservados pelo modelo C01; os complementares desta página começam em CT03.5.

Fontes: [Documento de Visão](../documento-de-visao.md), Quadros 3, 13, 14, 18, 20 e 21; [Documento de Arquitetura](../documento-de-arquitetura.md).

## 2. Critérios de aceitação testáveis

- [ ] **RF04** — Professor salva e consulta matérias com seus níveis, modalidades, valor da hora-aula e apresentação, sem alterar o perfil de outro usuário — CT03.5, CT03.7
- [ ] **RF04** — Campos obrigatórios ausentes, valor não positivo e matéria inexistente são recusados sem alteração do perfil — CT03.6
- [ ] **RF05** — A grade semanal publicada é persistida e seus horários livres aparecem no perfil público — CT03
- [ ] **RF05** — Faixas sobrepostas no mesmo dia são recusadas sem substituir a grade anterior — CT03.8
- [ ] **RF05** — A publicação de uma grade vazia remove a disponibilidade anterior — CT03.9
- [ ] **RF06** — Um bloqueio pontual retira o intervalo dos horários livres; sua remoção pelo dono restaura apenas os horários ainda disponíveis — CT03.10, CT03.11
- [ ] **RF06** — Bloqueios no passado, com intervalo inválido ou pertencentes a outro professor não são criados ou removidos — CT03.12, CT03.13

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT03 | Verificar a publicação da grade semanal (RF05) | RF05 | Sistema | Horários exibidos no perfil público do professor | ⚪ Pendente | 0 | — |
| CT03.5 | Salvar e consultar perfil completo em PUT/GET /professores/me | RF04 | Integração | Matérias e níveis vinculados, modalidades, valor e apresentação persistidos e retornados no perfil próprio | ⚪ Pendente | 0 | — |
| CT03.6 | Enviar perfil incompleto, valor zero/negativo ou materiaIds inexistentes | RF04 | Integração | Requisição recusada com indicação da validação; perfil anterior preservado | ⚪ Pendente | 0 | — |
| CT03.7 | Acessar manutenção de perfil, grade e bloqueios sem token e com perfil ALUNO | RF04, RF05, RF06 | Integração | Acesso negado; nenhum dado de professor alterado | ⚪ Pendente | 0 | — |
| CT03.8 | Substituir a grade por faixas que se sobrepõem no mesmo dia | RF05 | Unitário e integração | Sobreposição recusada; grade anterior preservada | ⚪ Pendente | 0 | — |
| CT03.9 | Substituir a grade por faixas: [] e consultar o perfil público | RF05 | Integração | Grade anterior removida e nenhum horário livre derivado dela exibido | ⚪ Pendente | 0 | — |
| CT03.10 | Criar bloqueio futuro dentro de uma faixa semanal e consultar horários livres | RF06 | Integração | Bloqueio persistido e intervalo bloqueado excluído da disponibilidade pública | ⚪ Pendente | 0 | — |
| CT03.11 | Remover um bloqueio próprio e consultar os horários livres | RF06 | Integração | Bloqueio removido; intervalo reaparece somente se couber na grade e não houver aula ocupando o horário | ⚪ Pendente | 0 | — |
| CT03.12 | Criar bloqueio no passado ou com início igual/posterior ao fim | RF06 | Integração | Validação recusa o intervalo e nenhum bloqueio é persistido | ⚪ Pendente | 0 | — |
| CT03.13 | Tentar remover por ID o bloqueio de outro professor | RF06 | Integração | Acesso negado e bloqueio original preservado | ⚪ Pendente | 0 | — |

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

Evidências dos testes pela interface: A preencher (capturas em `docs/assets/qualidade/c02/`).

**Resultado:** A preencher (ex.: 11 executados, 10 aprovados, 1 falhou).

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito registrado até o momento | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!-- Para cada defeito, copie o bloco abaixo. -->

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
