# Requisitos Não Funcionais

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
| Cenário | Requisitos não funcionais transversais |
| Requisitos | RNF01 Usabilidade (Must) · RNF02 Responsividade (Must) · RNF04 Desempenho (Should) · RNF05 Acessibilidade (Should) · RNF06 Privacidade (Should) |
| Histórias de usuário | **RNF01:** Todas as histórias com interface.<br>**RNF02:** Todas as histórias com interface.<br>**RNF04:** US07, US08, US17<br>**RNF05:** Todas as histórias com interface.<br>**RNF06:** US01, US04 |
| Casos do roteiro | CT11, CT12, CT14 (Documento de Visão, seção 6.2) |
| Sprint | Todas |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres (QA) · Pedro Caldas / Felipe Lima (UX/UI para usabilidade) |

RNF03/CT13 permanecem no [C01 — Cadastro e Autenticação](c01-cadastro-e-autenticacao.md). Os testes de interface e ambiente estão pendentes: a leitura exclusiva do back-end não permite deduzir conformidade nem ausência de responsividade, acessibilidade ou usabilidade. Para desempenho, a arquitetura considera o serviço ativo e 95% das requisições principais em até 2 s; registrar separadamente inicialização após hibernação e configuração de medição. Para privacidade, foram consultados `auth.schemas.ts`, `auth.service.ts`, `usuarios.service.ts` e `aulas.service.ts`: consentimento no cadastro, projeção do perfil público e restrição do contato por participação/status. Isso é evidência de código para planejar casos, não um parecer de conformidade. Em eventual defeito transversal, usar `DEF-Cnn-nn` com o cenário funcional em que foi observado e referenciar o caso RNF.

Fontes: [Documento de Visão](../documento-de-visao.md), Quadros 3, 13, 14, 18, 20 e 21; [Documento de Arquitetura](../documento-de-arquitetura.md).

## 2. Critérios de aceitação testáveis

- [ ] **RNF01** — O fluxo de reserva tem no máximo 5 passos, tempo médio até 3 min, conclusão de 100% dos cenários obrigatórios e inspeção heurística ≥ 90%, sem falhas críticas — CT11
- [ ] **RNF01** — Erro de validação apresenta orientação e permite retomar o fluxo sem perder os dados válidos — CT11.1
- [ ] **RNF02** — Fluxos principais funcionam em 360 px e no computador, sem rolagem horizontal da página — CT12, CT12.1
- [ ] **RNF02 / RNF05** — Ampliação de conteúdo preserva leitura e operação dos controles essenciais — CT12.2
- [ ] **RNF05** — Fluxos com interface podem ser percorridos por teclado, com foco identificável, sem bloqueio de navegação — CT12.3
- [ ] **RNF05** — Campos possuem rótulos identificáveis e texto/controles satisfazem os critérios aplicáveis de contraste WCAG 2.1 AA — CT12.4
- [ ] **RNF04** — Busca, perfil e painel carregam em até 2 s; no serviço ativo, 95% das requisições principais também atendem a 2 s — CT14, CT14.1
- [ ] **RNF06** — Cadastro exige consentimento e registra o aceite, sem criar conta quando o consentimento estiver ausente ou falso — CT14.2
- [ ] **RNF06** — Perfil público não expõe contato; somente participante autorizado consulta contato liberado após confirmação — CT14.3
- [ ] **RNF06** — Coleta fica limitada aos dados necessários ao fluxo e respostas públicas não retornam credenciais nem hashes — CT14.4

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT11 | Verificar tempo, conclusão dos cenários e heurísticas da reserva (RNF01) | RNF01 | Sistema | Fluxo com até 5 passos, tempo médio ≤ 3 min, 100% dos cenários obrigatórios concluídos e inspeção heurística ≥ 90%, sem falhas críticas | ⚪ Pendente | 0 | — |
| CT12 | Verificar o uso em tela pequena (RNF02) | RNF02 | Sistema | Fluxos principais utilizáveis, sem rolagem horizontal | ⚪ Pendente | 0 | — |
| CT14 | Verificar o desempenho das telas principais (RNF04) | RNF04 | Sistema | Busca, perfil e painel carregados em até 2 s | ⚪ Pendente | 0 | — |
| CT11.1 | Provocar erro de validação durante reserva e retomar o preenchimento | RNF01 | Sistema | Orientação compreensível apresentada e dados válidos preservados para continuar o fluxo | ⚪ Pendente | 0 | — |
| CT12.1 | Executar busca, perfil e reserva em celular de 360 px e em computador | RNF02 | Sistema | Conteúdo e controles utilizáveis em ambas as larguras, sem rolagem horizontal da página | ⚪ Pendente | 0 | — |
| CT12.2 | Ampliar conteúdo e verificar leitura e operação nos fluxos principais | RNF02, RNF05 | Sistema | Conteúdo essencial permanece legível e controles acessíveis, sem perda de funcionalidade pela ampliação | ⚪ Pendente | 0 | — |
| CT12.3 | Percorrer cadastro, login, busca, solicitação e decisões usando apenas teclado | RNF05 | Sistema | Ordem de foco coerente, foco visível e todas as ações essenciais alcançáveis sem armadilha de teclado | ⚪ Pendente | 0 | — |
| CT12.4 | Inspecionar rótulos dos campos e contraste de texto e controles | RNF05 | Sistema | Campos com nomes identificáveis e contraste compatível com os critérios aplicáveis da WCAG 2.1 AA; evidências reais registradas na execução | ⚪ Pendente | 0 | — |
| CT14.1 | Medir requisições de busca, perfil e painel com o serviço ativo | RNF04 | Sistema | 95% das requisições principais respondem em até 2 s; registrar amostra, ambiente, condições e tempos efetivamente observados | ⚪ Pendente | 0 | — |
| CT14.2 | Cadastrar com consentimento ausente/falso e depois com consentimento verdadeiro | RNF06 | Integração | Ausência/recusa impede cadastro; aceite válido permite cadastro e registra consentimentoLgpdEm | ⚪ Pendente | 0 | — |
| CT14.3 | Consultar perfil público e contato da aula antes/depois da confirmação e como terceiro | RNF06 | Integração | Perfil público omite e-mail/telefone; contato só é liberado ao participante nos estados autorizados após confirmação; terceiros não acessam o detalhe | ⚪ Pendente | 0 | — |
| CT14.4 | Revisar dados solicitados e respostas de cadastro, usuário atual e perfil público | RNF06 | Sistema e integração | Apenas dados necessários ao fluxo são solicitados; respostas não expõem senha, hash de senha ou hash de token de recuperação | ⚪ Pendente | 0 | — |

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

Evidências dos testes pela interface: A preencher (capturas em `docs/assets/qualidade/rnf/`).

**Resultado:** A preencher (ex.: 11 executados, 10 aprovados, 1 falhou).

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito registrado até o momento | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!-- Para cada defeito, copie o bloco abaixo. -->

<!--
### DEF-Cnn-nn — Título do defeito

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
| Pedro Caldas | A preencher |
| Felipe Lima | A preencher |
| **Total** | **100** |
