# C01 — Cadastro e Autenticação de Usuários

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
| Cenário | C01 — Cadastro e autenticação de usuários |
| Requisitos | RF01 Cadastrar usuário (Must) · RF02 Autenticar usuário (Must) · RF03 Recuperar senha (Should) · RNF03 Segurança (Must) |
| Histórias de usuário | US01, US02, US03 |
| Casos do roteiro | CT01, CT02, CT13 (Documento de Visão, seção 6.2) |
| Sprint | 3 |
| Responsáveis (QA) | Pedro Rodrigues / Yasmim Ayres |

## 2. Critérios de aceitação testáveis

- [ ] **RF01** — Visitante se cadastra como aluno ou professor, com nome, e-mail, senha e telefone, e é direcionado ao painel do seu perfil — CT01, CT01.1, CT01.2
- [ ] **RF02** — Usuário entra com e-mail e senha válidos e recebe um token JWT — CT02.1
- [ ] **RF02** — Credenciais incorretas são recusadas com mensagem clara, sem revelar qual dado está errado — CT02
- [ ] **RF02** — Usuário consegue sair da plataforma — CT02.2
- [ ] **RF03** — Usuário recebe por e-mail um link para redefinir a senha e consegue entrar com a nova senha — CT03.1 a CT03.4
- [ ] **RNF03** — Senhas são armazenadas apenas como hash bcrypt — CT13

## 3. Casos de teste

Os casos CTxx vêm do roteiro do Documento de Visão. Os casos CTxx.y complementam o roteiro.
A coluna **Ciclos** conta quantas vezes o caso foi executado até ser aprovado.

| Caso | Descrição | Req. | Nível | Esperado | Status | Ciclos | Defeito |
|---|---|---|---|---|---|---|---|
| CT01 | Cadastro com dados válidos | RF01 | Sistema | Conta criada e usuário direcionado ao painel do seu perfil | ⚪ Pendente | 0 | — |
| CT01.1 | Cadastro com e-mail já existente | RF01 | Integração | Cadastro recusado com mensagem clara | ⚪ Pendente | 0 | — |
| CT01.2 | Cadastro sem campos obrigatórios | RF01 | Integração | Cadastro recusado indicando os campos faltantes | ⚪ Pendente | 0 | — |
| CT02 | Login com credenciais incorretas | RF02 | Integração | Acesso negado com mensagem clara, sem revelar qual dado está errado | ⚪ Pendente | 0 | — |
| CT02.1 | Login com credenciais válidas | RF02 | Integração | Token JWT retornado | ⚪ Pendente | 0 | — |
| CT02.2 | Logout | RF02 | Sistema | Sessão encerrada e rotas protegidas inacessíveis | ⚪ Pendente | 0 | — |
| CT03.1 | Solicitar recuperação com e-mail cadastrado | RF03 | Integração | E-mail com link de redefinição enviado | ⚪ Pendente | 0 | — |
| CT03.2 | Solicitar recuperação com e-mail não cadastrado | RF03 | Integração | Resposta genérica, sem revelar se o e-mail existe | ⚪ Pendente | 0 | — |
| CT03.3 | Redefinir senha com token válido e entrar com a nova senha | RF03 | Integração | Senha antiga recusada e nova senha aceita | ⚪ Pendente | 0 | — |
| CT03.4 | Redefinir senha com token inválido ou expirado | RF03 | Integração | Redefinição recusada | ⚪ Pendente | 0 | — |
| CT13 | Armazenamento de senha | RNF03 | Integração | Senha armazenada apenas como hash bcrypt | ⚪ Pendente | 0 | — |

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

Evidências dos testes pela interface: A preencher (capturas em `docs/assets/qualidade/c01/`).

**Resultado:** A preencher (ex.: 11 executados, 10 aprovados, 1 falhou).

## 5. Defeitos e correções

| ID | Caso | Descrição | Severidade | Issue | Situação |
|---|---|---|---|---|---|
| — | — | Nenhum defeito registrado até o momento | — | — | — |

**Situações:** Aberto · Em correção · Em reteste · Corrigido

<!-- Para cada defeito, copie o bloco abaixo. -->

<!--
### DEF-C01-nn — Título do defeito

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
