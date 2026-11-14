# AulaCerta - Agendamento de aulas particulares

> Projeto desenvolvido para a disciplina de **Métodos de Desenvolvimento de Software (MDS)**
> Universidade de Brasília — FCTE/FGA | Prof. Ricardo Ajax Dias Kosloski

O **AulaCerta** é uma aplicação web responsiva que organiza o agendamento de aulas particulares. O professor publica as matérias, os níveis, o valor da hora-aula e a grade semanal de horários; o aluno encontra um professor e solicita a aula, avulsa ou semanal; o professor confirma ou recusa, e o sistema impede dois agendamentos no mesmo horário. Os dois acompanham o status de cada aula e recebem notificações pela própria plataforma, sem depender de conversas soltas no WhatsApp.

## Aplicação no ar

**Acesse em: <https://aulacerta-p50c.onrender.com>**

| Parte | Endereço |
|---|---|
| Site | <https://aulacerta-p50c.onrender.com> |
| API | <https://aulacerta-api.onrender.com/api/v1> (verificação: [`/saude`](https://aulacerta-api.onrender.com/api/v1/saude)) |

Para testar, entre com uma das [contas de demonstração](#contas-de-demonstração) ou crie uma conta nova.

> A API está no plano gratuito do Render, que desliga o serviço depois de 15 minutos sem uso. O primeiro acesso depois disso pode levar cerca de um minuto; em seguida, tudo responde normalmente. O site em si fica sempre disponível.

## Documentação

**Acesse em: <https://fga0138-mds-ajax.github.io/2026.2-T02-Hopper/>**

| Página | Conteúdo |
|---|---|
| [Documento de Visão](https://fga0138-mds-ajax.github.io/2026.2-T02-Hopper/documento-de-visao/v1-1/) | Problema, requisitos, histórias de usuário, processo e roteiro de testes |
| [Documento de Arquitetura](https://fga0138-mds-ajax.github.io/2026.2-T02-Hopper/documento-de-arquitetura/v1-1/) | Visão arquitetural, camadas, modelo de dados e implantação |
| [Qualidade e testes](https://fga0138-mds-ajax.github.io/2026.2-T02-Hopper/qualidade/) | Casos de teste por cenário, defeitos, correções e cobertura |
| [Relatório de testes](https://fga0138-mds-ajax.github.io/2026.2-T02-Hopper/assets/qualidade/relatorio-de-testes/index.html) | Resultado da última execução dos testes automatizados |

---

## Funcionalidades

| Para quem | O que já funciona |
|---|---|
| Todos | Cadastro como aluno ou professor, com consentimento (LGPD); login e saída; recuperação de senha por e-mail; edição de nome e telefone |
| Professor | Perfil com matérias e níveis, modalidades (online, presencial ou em domicílio), valor da hora-aula e apresentação; grade semanal de horários; bloqueios pontuais (feriados, compromissos); aceite ou recusa dos pedidos |
| Aluno | Busca de professores por matéria, nível e modalidade; perfil público com os horários realmente livres; solicitação de aula avulsa ou semanal (de 2 a 12 semanas) |
| Aluno e professor | "Minhas aulas" com próximas aulas, pedidos pendentes e histórico; notificações com contador de não lidas; contato do outro participante liberado só depois da confirmação |

Previstos para a Sprint 5 (16/11 a 26/11/2026): remarcação, cancelamento, filtros do histórico e lembretes.

---

## Tecnologias utilizadas

### Back-end

| Tecnologia | Uso |
|---|---|
| [Node.js](https://nodejs.org/) 20+ e [TypeScript](https://www.typescriptlang.org/) | Linguagem e ambiente de execução da API, com TypeScript em modo estrito. |
| [Express](https://expressjs.com/) 5 | API REST em `/api/v1`, organizada em módulos (auth, usuarios, agenda, aulas e notificacoes). |
| [Prisma](https://www.prisma.io/) 7 | Acesso ao banco, schema e migrações. As alterações de esquema são feitas somente por migrações. |
| [PostgreSQL](https://www.postgresql.org/) 16 | Banco de dados. No [Neon](https://neon.tech/) (nuvem) ou local, pelo Docker. |
| [Zod](https://zod.dev/) | Validação de toda requisição antes de chegar às regras de negócio. |
| JWT e bcrypt | Autenticação por token (validade padrão de 2 h) e hash das senhas. |
| Helmet, CORS e express-rate-limit | Cabeçalhos de segurança, origem permitida e limite de tentativas de login. |
| [Brevo](https://www.brevo.com/) | Envio do e-mail de recuperação de senha. **Opcional** no desenvolvimento: sem a chave, o link aparece no terminal da API. |

### Front-end

| Tecnologia | Uso |
|---|---|
| [React](https://react.dev/) 18 e TypeScript | Interface, em páginas, componentes, hooks e contextos. |
| [Vite](https://vite.dev/) 6 | Servidor de desenvolvimento e build. |
| [Tailwind CSS](https://tailwindcss.com/) | Estilo e layout responsivo (a partir de 360 px de largura). |
| [React Router](https://reactrouter.com/) 7 | Rotas públicas e rotas protegidas por perfil. |
| [TanStack Query](https://tanstack.com/query) e Axios | Chamadas à API, cache e atualização dos dados. |
| React Hook Form e Zod | Formulários e validação no navegador. |

### Testes e qualidade

| Tecnologia | Uso |
|---|---|
| [Vitest](https://vitest.dev/) | Testes unitários do back-end e do front-end, com cobertura. |
| [Supertest](https://github.com/ladjs/supertest) | Testes de integração da API com um banco de teste separado. |
| [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | Testes de componentes e páginas do front-end. |
| [Playwright](https://playwright.dev/) | Testes de sistema no navegador (fluxos de aluno e professor e telas em 360 px). |
| ESLint e Prettier | Padronização e formatação do código. |

### Implantação e documentação

| Tecnologia | Uso |
|---|---|
| [Render](https://render.com/) | Produção: o front-end como site estático e a API como serviço web em Docker, publicados a cada merge na `developer`. |
| [Neon](https://neon.tech/) | Banco PostgreSQL de produção. |
| [MkDocs](https://www.mkdocs.org/) com Material for MkDocs | Site da documentação, publicado no GitHub Pages a partir da branch `docs`. |

---

## Como executar o projeto localmente

### Pré-requisitos

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) **20 ou mais recente** (recomendado: 22 LTS), que já traz o npm
- Um banco **PostgreSQL** para o sistema e **outro, separado,** para os testes. Escolha uma opção:
  - [Neon](https://neon.tech/) (gratuito, sem instalar nada); ou
  - [Docker](https://www.docker.com/), que sobe os dois bancos com um comando
- [VS Code](https://code.visualstudio.com/) (opcional, mas recomendado)
- Chave do [Brevo](https://www.brevo.com/) (opcional): só para enviar de verdade o e-mail de recuperação de senha

### 1. Clone o repositório

```bash
git clone https://github.com/FGA0138-MDS-Ajax/2026.2-T02-Hopper.git
cd 2026.2-T02-Hopper
git checkout developer
```

A versão em desenvolvimento fica na branch `developer`.

### 2. Prepare o banco de dados

**Opção A: Docker.** Dentro de `backend/`, suba o banco do sistema (porta 5432) e o de testes (porta 5433):

```bash
cd backend
docker compose up -d banco banco-teste
cd ..
```

As URLs desses bancos já estão no `backend/.env.example`.

**Opção B: Neon.** Crie um projeto, copie a URL de conexão para `DATABASE_URL` e crie um segundo banco (ou uma branch do Neon) para `DATABASE_URL_TESTE`.

> O banco de testes é **apagado** a cada execução dos testes de integração e de sistema. Ele precisa ser diferente do banco do sistema; os testes se recusam a rodar se as duas URLs forem iguais.

### 3. Configure e inicie o back-end (API)

```bash
cd backend
cp .env.example .env        # Windows (PowerShell): copy .env.example .env
npm install
npm run prisma:migrate      # cria as tabelas
npm run prisma:seed         # matérias e contas de demonstração
npm run dev
```

A API fica em <http://localhost:3333/api/v1>. Para conferir se está no ar, abra <http://localhost:3333/api/v1/saude>.

Variáveis do `backend/.env`:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Banco do sistema |
| `DATABASE_URL_TESTE` | Para os testes | Banco separado, usado só pelos testes de integração e de sistema |
| `JWT_SECRET` | Sim | Segredo do token, com pelo menos 32 caracteres |
| `JWT_EXPIRES_IN` | Não | Validade do token (padrão: `2h`) |
| `PORT` | Não | Porta da API (padrão: `3333`) |
| `CORS_ORIGIN` | Sim | Endereço do front-end (local: `http://localhost:5173`) |
| `FRONTEND_URL` | Sim | Base do link de redefinição de senha (local: `http://localhost:5173`) |
| `BREVO_API_KEY` | Só em produção | Chave da API do Brevo |
| `EMAIL_REMETENTE` e `EMAIL_REMETENTE_NOME` | Com o Brevo | Remetente verificado no Brevo |
| `SEED_ADMIN_EMAIL` e `SEED_SENHA` | Não | Usados pelo seed |

> Nunca versione o arquivo `.env`. Ele já está no `.gitignore`.

### 4. Configure e inicie o front-end

Em **outro terminal**, a partir da raiz do repositório:

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:3333/api/v1
npm install
npm run dev
```

Acesse o site em <http://localhost:5173>.

### Contas de demonstração

O `npm run prisma:seed` cria as matérias Matemática, Física e Inglês (ensino médio) e Português (ensino fundamental), além destas contas, todas com a senha `Senha@12345` (ou a definida em `SEED_SENHA`):

| Perfil | E-mail |
|---|---|
| Professora | `ana.professora@aulacerta.com.br` |
| Professor | `bruno.professor@aulacerta.com.br` |
| Aluno | `caio.aluno@aulacerta.com.br` |
| Aluna | `daniela.aluna@aulacerta.com.br` |

O seed pode ser rodado mais de uma vez: se as contas já existirem, ele não altera nada.

> Essas credenciais são apenas para desenvolvimento local. Não use esses valores em ambientes acessíveis pela internet.

### Atualizando o banco após um `git pull`

Quando alguém da equipe alterar o `backend/prisma/schema.prisma`, aplique as novas migrações:

```bash
cd backend
npm run prisma:migrate
```

---

## Testes

O projeto tem quatro tipos de testes automatizados:

| Tipo | Onde ficam | O que verificam |
|---|---|---|
| Unitários do back-end | `backend/src/**/*.test.ts` | Regras de negócio dos serviços (conflitos de horário, status das aulas, autenticação) |
| Integração | `backend/tests/integration/` | A API completa, com o banco de teste |
| Front-end | `frontend/src/**/*.test.tsx` | Componentes, páginas, hooks e serviços |
| Sistema | `e2e/testes/` | Fluxos completos no navegador, como aluno e professor, e telas em 360 px |

### Antes da primeira execução

1. Instale as dependências do `backend/` e do `frontend/` (passos 3 e 4 acima).
2. Preencha `DATABASE_URL_TESTE` no `backend/.env` com um banco **separado**.
3. Para os testes de sistema, instale o Playwright e o navegador uma única vez:

```bash
cd e2e
npm install
npm run instalar-navegador
cd ..
```

### Executando os testes

Na **raiz** do repositório:

```bash
npm run testes              # os quatro tipos, em sequência
npm run testes:backend      # só os unitários do back-end, com cobertura
npm run testes:integracao   # só os de integração
npm run testes:frontend     # só os do front-end, com cobertura
npm run testes:sistema      # só os de sistema (Playwright)
```

Os testes de sistema sobem sozinhos uma API na porta 3334 e um site na porta 5174, ligados ao banco de teste. Não é preciso deixar o `npm run dev` aberto.

Durante o desenvolvimento, também dá para rodar direto em cada pasta, sem gerar relatório: `npm test` e `npm run test:integration` no `backend/`, `npm test` no `frontend/` e `npm test` ou `npm run test:ui` (modo visual) no `e2e/`.

### Acessando o relatório dos testes

Cada execução pelos comandos da raiz grava uma pasta em `relatorios/<tipo>/<data e hora>/` com:

| Arquivo | Conteúdo |
|---|---|
| `execucao.log` | Saída completa do terminal |
| `html/index.html` | Resultado de cada teste. No Playwright, inclui capturas de tela e, nas falhas, vídeo e passo a passo |
| `cobertura/index.html` | Cobertura do código linha a linha (back-end unitário e front-end) |

Para ver tudo em uma página só, abra o **índice dos relatórios** no navegador:

```bash
start relatorios/index.html      # Windows
open relatorios/index.html       # macOS
xdg-open relatorios/index.html   # Linux
```

Para recriar só o índice, sem rodar os testes: `node scripts/registrar-testes.mjs indice`.

A pasta `relatorios/` não vai para o Git. O relatório da **última execução** fica publicado na [documentação](https://fga0138-mds-ajax.github.io/2026.2-T02-Hopper/qualidade/), na seção **Qualidade**, pelo botão **Acessar o relatório de testes**. Ali também estão o roteiro de testes por cenário (C01 a C06), os defeitos encontrados e as correções.

### Meta de cobertura

Pelo menos **70%** em instruções, ramificações, funções e linhas. Abaixo disso, o comando de cobertura falha.

- **Back-end:** medida nos serviços de domínio (`src/modules/**/*.service.ts`), onde estão as regras de negócio.
- **Front-end:** medida em todo o `src`, exceto os próprios testes.

### Problemas comuns

| Problema | Solução |
|---|---|
| Os testes de integração se recusam a rodar | Confira se `DATABASE_URL_TESTE` está preenchida e é diferente de `DATABASE_URL` |
| "Vitest failed to find the current suite" no Windows | O terminal foi aberto com a unidade em minúscula (`c:\`). Use os comandos da raiz, que corrigem isso, ou abra o terminal em `C:\` |
| Testes do front-end falhando no Node 25 ou mais recente | Os comandos da raiz já tratam isso. Rodando na pasta `frontend/`, defina `NODE_OPTIONS=--no-experimental-webstorage` |
| Testes de sistema não encontram o navegador | Rode `npm run instalar-navegador` dentro de `e2e/` |

---

## Estrutura do projeto

```text
2026.2-T02-Hopper/
├── README.md
├── package.json                 # Atalhos para rodar os testes a partir da raiz
├── scripts/
│   └── registrar-testes.mjs     # Roda os testes e grava log, relatório HTML e cobertura em relatorios/
├── backend/                     # API REST
│   ├── Dockerfile               # Imagem usada no Render
│   ├── docker-compose.yml       # Bancos local e de teste, e a API em contêiner
│   ├── prisma/
│   │   ├── schema.prisma        # Modelo de dados
│   │   ├── migrations/          # Migrações do banco
│   │   └── seed.ts              # Matérias e contas de demonstração
│   ├── src/
│   │   ├── app.ts               # Middlewares e montagem das rotas em /api/v1
│   │   ├── server.ts            # Inicialização do servidor
│   │   ├── config/              # Variáveis de ambiente validadas
│   │   ├── infra/               # Conexão com o banco (Prisma) e envio de e-mail (Brevo)
│   │   ├── shared/              # Middlewares (autenticação, validação), erros e utilitários
│   │   └── modules/             # Um módulo por domínio, cada um com routes, controller, service e testes
│   │       ├── auth/            # Cadastro, login e recuperação de senha
│   │       ├── usuarios/        # Conta, perfil do professor, busca e matérias
│   │       ├── agenda/          # Grade semanal e bloqueios
│   │       ├── aulas/           # Solicitação, aceite, recusa e detalhes da aula
│   │       └── notificacoes/    # Notificações na aplicação
│   └── tests/integration/       # Testes de integração com o banco de teste
├── frontend/                    # Aplicação React
│   └── src/
│       ├── App.tsx              # Rotas
│       ├── pages/               # Uma página por tela
│       ├── components/          # Componentes reutilizáveis
│       ├── hooks/ e contexts/   # Estado compartilhado e sessão do usuário
│       ├── services/            # Cliente da API
│       └── utils/               # Datas, formatação e validações
└── e2e/                         # Testes de sistema (Playwright)
    ├── playwright.config.ts     # Sobe a API (porta 3334) e o site (porta 5174) para os testes
    ├── apoio/                   # Preparação do banco de teste e chamadas à API
    └── testes/                  # Um arquivo por cenário (C01 a C04 e RNF02)
```

### Rotas do site

Relativas a `http://localhost:5173`. "Logado" significa que a página exige login; sem ele, o usuário vai para `/entrar`.

| Rota | Descrição | Acesso |
|---|---|---|
| `/` | Página inicial | Público |
| `/professores` | Busca de professores | Público |
| `/professores/:id` | Perfil público do professor, com os horários livres | Público |
| `/professores/:id/solicitar` | Solicitar aula | Aluno |
| `/entrar` e `/cadastro` | Login e cadastro | Público |
| `/recuperar-senha` e `/redefinir-senha` | Recuperação de senha | Público |
| `/privacidade` | Política de privacidade | Público |
| `/meu-perfil` | Dados da conta; para o professor, também o perfil e a agenda | Logado |
| `/minhas-aulas` | Próximas aulas, pedidos pendentes e histórico | Logado |
| `/notificacoes` | Notificações | Logado |

### Rotas da API

Relativas a `http://localhost:3333/api/v1`. As rotas marcadas como "Aluno", "Professor" ou "Logado" exigem o cabeçalho `Authorization: Bearer <token>`.

| Método e rota | Descrição | Acesso |
|---|---|---|
| `GET /saude` | Verifica se a API está no ar | Público |
| `POST /auth/cadastro` | Cadastro de aluno ou professor | Público |
| `POST /auth/login` | Login (com limite de tentativas) | Público |
| `GET /auth/me` | Usuário logado | Logado |
| `POST /auth/recuperar-senha` e `/auth/redefinir-senha` | Recuperação de senha | Público |
| `PUT /usuarios/me` | Editar nome e telefone | Logado |
| `GET /materias` | Matérias disponíveis | Público |
| `GET /professores` | Busca de professores (filtros por matéria, nível e modalidade) | Público |
| `GET /professores/:id` | Perfil público e horários livres | Público |
| `GET` e `PUT /professores/me` | Perfil do professor logado | Professor |
| `GET` e `PUT /professores/me/disponibilidade` | Grade semanal | Professor |
| `GET` e `POST /professores/me/bloqueios`, `DELETE /professores/me/bloqueios/:id` | Bloqueios pontuais | Professor |
| `POST /aulas` | Solicitar aula, avulsa ou semanal | Aluno |
| `GET /aulas` e `GET /aulas/:id` | Aulas do usuário e detalhes de uma aula | Aluno ou professor |
| `PATCH /aulas/:id/aceitar` e `/aulas/:id/recusar` | Aceitar ou recusar um pedido | Professor |
| `GET /notificacoes` e `PATCH /notificacoes` | Listar notificações e marcar como lidas | Aluno ou professor |

---

## Padrões de código

Definidos no [Documento de Arquitetura](https://fga0138-mds-ajax.github.io/2026.2-T02-Hopper/documento-de-arquitetura/v1-1/):

- TypeScript em modo estrito no back-end e no front-end, com ESLint e Prettier (`npm run lint` e `npm run format:check` em cada pasta).
- Toda requisição é validada com Zod antes de chegar às regras de negócio.
- Regras de negócio ficam nos serviços (`*.service.ts`), e não nos controllers, para poderem ser testadas sem uma requisição HTTP.
- Identificadores, comentários e documentação em **português**.
- Datas e horários no fuso de Brasília.
- Alterações no banco somente por migrações do Prisma.
- Nenhum código entra na `developer` sem pull request revisado e com os testes passando.

---

## Política de branches

| Branch | Finalidade |
|---|---|
| `main` | Versão estável. Recebe a `developer` quando uma versão fica pronta para publicação. |
| `developer` | Branch de integração. Todo código entra nela por pull request revisado. |
| `feature/<descricao>` | Nova funcionalidade (ex.: `feature/us13-notificacoes`). |
| `fix/<descricao>` | Correção de defeito (ex.: `fix/rf12-aceites-simultaneos`). |
| `test/<descricao>` | Novos testes ou ajustes nos testes (ex.: `test/cobertura-frontend`). |
| `docs` | Fonte da documentação em MkDocs. |
| `gh-pages` | Site da documentação gerado para o GitHub Pages. Não recebe código. |

### Fluxo de trabalho

1. Crie a branch de trabalho a partir da `developer`.
2. Desenvolva com testes e rode `npm run testes` antes de abrir o pull request.
3. Abra o pull request para a `developer`. Ele é revisado pelo Analista de Qualidade e por mais um desenvolvedor.
4. Ao fim da sprint, o P.O. valida as entregas na revisão; quando a versão está pronta, a `developer` é integrada à `main`.

---

## Política de commits (Conventional Commits)

Formato: `tipo(escopo opcional): descrição`

Exemplo: `feat(aulas): solicitar aulas semanais (RF10)`

```text
feat      → nova funcionalidade
fix       → correção de defeito
docs      → documentação
style     → formatação, sem mudança de lógica
refactor  → refatoração, sem nova funcionalidade nem correção
test      → adição ou correção de testes
chore     → configuração e manutenção
perf      → melhoria de desempenho
ci        → integração contínua
build     → dependências e build
```

- Prefixo em inglês e descrição em português.
- Um espaço depois dos dois-pontos (`feat: texto`, e não `feat:texto`).
- Quando fizer sentido, cite o requisito ou o caso de teste (ex.: `RF12`, `CT05`).

---

## Equipe

**Grupo Hopper - MDS 2026.2 - UnB FCTE/FGA**

Papéis conforme o Quadro 3 do Documento de Visão. Em **negrito**, o papel em que o integrante é o responsável. Todos os integrantes também atuam como desenvolvedores.

| Membro | Papéis |
|---|---|
| Pedro França de Lima | **Scrum Master**, **Product Owner**, Desenvolvedor |
| Matheus Ferraz de Queiroz | **Desenvolvedor back-end** |
| Daniel Valle Rodrigues Maia | Desenvolvedor back-end |
| Pedro Henrique Caldas Alves | **Designer UX/UI**, **Desenvolvedor front-end** |
| Felipe Lima Sant'Ana | Designer UX/UI, Desenvolvedor front-end |
| Juliana Pereira de Rocha | **Desenvolvedora de banco de dados** |
| Yasmim Ayres dos Santos Guedes | Desenvolvedora de banco de dados, Analista de Qualidade |
| Pedro Henrique Rodrigues Pereira | **Analista de Qualidade** |
