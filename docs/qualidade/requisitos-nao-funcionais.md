# Requisitos Não Funcionais

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
| Cenário | Requisitos não funcionais transversais |
| Requisitos | RNF02 Responsividade (Must) · RNF06 Privacidade (Should) |
| Histórias de usuário | **RNF02:** todas as histórias com interface · **RNF06:** US01, US04, US11 |
| Casos do roteiro | CT12, CT14 (Documento de Visão, seção 6.2) |
| Sprint | Todas |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

O RNF03 (segurança) e seu caso CT13 ficam no [C01 — Cadastro e Autenticação](c01-cadastro-e-autenticacao.md). O Documento de Visão 1.1 mantém apenas os requisitos não funcionais que a equipe comprova com testes (RNF02, RNF03 e RNF06); usabilidade, desempenho e acessibilidade são diretrizes de projeto, sem casos de teste.

## 2. Critérios de aceitação testáveis

- [x] **RNF02** — As telas principais funcionam a partir de 360 px de largura, sem rolagem horizontal da página — CT12, CT12.1
- [x] **RNF06** — O cadastro exige consentimento e registra o aceite — CT14, CT14.2
- [x] **RNF06** — O perfil público não expõe e-mail nem telefone; o contato do outro participante só é liberado depois da confirmação da aula — CT14, CT14.3
- [x] **RNF06** — As respostas da API não devolvem senha nem hash de senha — CT14.4

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT12 | Uso em tela pequena | RNF02 | Sistema | Fluxos principais utilizáveis em 360 px, sem rolagem horizontal | ✅ Aprovado | 1 | — |
| CT12.1 | Abrir as telas públicas e as do aluno em 360 px | RNF02 | Sistema | Nenhuma tela com rolagem horizontal | ✅ Aprovado | 1 | — |
| CT14 | Privacidade dos dados | RNF06 | Integração | Cadastro sem consentimento recusado; perfil público sem contato; contato liberado só após a confirmação | ✅ Aprovado | 1 | — |
| CT14.2 | Cadastrar sem consentimento e depois com consentimento | RNF06 | Integração | Sem consentimento, cadastro recusado; com consentimento, conta criada com a data do aceite | ✅ Aprovado | 1 | — |
| CT14.3 | Consultar o perfil público e o contato da aula antes e depois da confirmação, e como terceiro | RNF06 | Integração | Perfil público sem e-mail e telefone; contato só para o participante, após a confirmação | ✅ Aprovado | 1 | — |
| CT14.4 | Conferir as respostas de cadastro, login e perfil público | RNF06 | Unitário e integração | Nenhuma resposta contém senha ou hash de senha | ✅ Aprovado | 1 | — |

**Legenda:** ⚪ Pendente · ✅ Aprovado · ❌ Falhou · 🔁 Em reteste · ⛔ Bloqueado

**Testes que comprovam cada caso**

| Caso | Teste automatizado |
|---|---|
| CT12 e CT12.1 | Playwright `rnf02-responsividade.spec.ts`: "CT12 — telas principais em 360 px, sem rolagem horizontal". Percorre, como visitante, `/`, `/professores`, o perfil de um professor, `/entrar` e `/cadastro`, e, como aluno, `/minhas-aulas`, `/notificacoes`, `/meu-perfil` e a solicitação de aula; mede a rolagem horizontal e salva uma captura de cada tela. Os demais testes do Playwright rodam em tamanho de computador |
| CT14 e CT14.2 | Integração `auth.test.ts`: "exige consentimento LGPD" (422 sem consentimento) e "cria aluno e nunca devolve o hash da senha (CT13)" (com consentimento; a data do aceite é obrigatória no banco) |
| CT14 e CT14.3 | Integração `usuarios.test.ts`: "devolve perfil e horários livres das próximas semanas sem dados de contato" e "lista somente professores com perfil completo e sem expor e-mail ou telefone"; `aulas.test.ts`: "revela o contato do outro usuário somente depois da confirmação (RNF06)" e "nega a quem não participa" |
| CT14.4 | Integração: "cria aluno e nunca devolve o hash da senha (CT13)"; unitário: "devolve token válido e usuário sem o hash da senha" |

**Fora do escopo:** os casos de usabilidade (CT11 e CT11.1), desempenho (antigo CT14 e CT14.1) e acessibilidade (CT12.2 a CT12.4) saíram do roteiro com RNF01, RNF04 e RNF05 na versão 1.1 do Documento de Visão.

## 4. Execuções

Registre cada execução abaixo, da mais recente para a mais antiga.

### Execução 1 — 14/11/2026

| Campo | Valor |
|---|---|
| Responsável | Pedro França |
| Branch / commit | Branch `test/casos-pendentes-do-roteiro`: código do commit `a6b0102` da `developer` mais os testes complementares desta branch |
| Motivo | Execução completa dos testes automatizados |
| Casos executados | CT12, CT12.1, CT14, CT14.2 a CT14.4 |

| Caso | Observado | Status |
|---|---|---|
| CT12 e CT12.1 | As nove telas abriram em 360 px sem rolagem horizontal | ✅ |
| CT14 e CT14.2 | Sem consentimento, 422; com consentimento, conta criada | ✅ |
| CT14.3 | Perfil público e busca sem e-mail e telefone; contato liberado só após a confirmação; terceiro recebeu 403 | ✅ |
| CT14.4 | Nenhuma resposta com senha ou hash | ✅ |

Saída dos testes automatizados (`npm run testes`, na raiz):

```text
Back-end — testes de integração:
  ✓ tests/integration/auth.test.ts (13 tests)
  ✓ tests/integration/usuarios.test.ts (12 tests)
  ✓ tests/integration/aulas.test.ts (27 tests)
  73 de 73 aprovados
Sistema (Playwright):
  ok 9 › CT12 — telas principais em 360 px, sem rolagem horizontal (4.9s)
```

Evidências: [relatório de testes](../assets/qualidade/relatorio-de-testes/index.html) e [relatório do Playwright](../assets/qualidade/relatorio-de-testes/e2e/2026-11-14_13-50-04/html/index.html), com a captura de cada tela em 360 px.

**Resultado:** 6 casos executados, 6 aprovados.

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito encontrado | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

## 6. Cobertura

Os requisitos não funcionais são verificados pelos casos acima, e não por métrica de cobertura. A cobertura dos arquivos envolvidos está nas páginas C01 a C04.

## 7. Parecer final

**Situação:** ✅ Aprovado

RNF02 e RNF06 estão comprovados por testes automatizados de sistema e de integração, sem defeitos. As telas da Sprint 5 (remarcação, cancelamento e lembretes) entram no CT12 quando forem criadas.

## 8. Contribuições

| Integrante | Pontos de contribuição |
|---|---|
| Pedro Rodrigues | A preencher |
| Yasmim Ayres | A preencher |
| **Total** | **100** |
