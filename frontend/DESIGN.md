# AulaCerta — Guia de design

Referência visual para todas as telas do front-end. Antes de criar uma tela nova, confira este guia; se precisar de algo que não está aqui, adicione aqui primeiro.

## 1. Ideia central

O Superprof ajuda a **encontrar** um professor. O AulaCerta resolve o que vem **depois**: horário, pedido, confirmação e acompanhamento. Por isso a interface sempre deixa o **status da aula** à vista (selos "Solicitada", "Confirmada" etc.) e mostra horários **reais**, nunca "a combinar".

- **Estrutura de página inspirada no Superprof**: busca grande no topo, atalhos por matéria e cartões de professores.
- **Estilo próprio**: azul profundo, tipografia pesada e compacta, cartões brancos com cantos bem arredondados.
- **O que evitamos**: o rosa/coral e as fotos grandes de rosto do Superprof. Avatares são iniciais em círculo colorido (não dependemos de fotos que os professores ainda não enviam).
- **Sem cara de template**: nada de bolhas/círculos decorativos, cartões "flutuando" sobre outros, painéis translúcidos (glass), rótulos em caixa-alta com tracinho antes do título, números gigantes apagados ao fundo nem telas falsas do produto como ilustração. O conteúdo e a hierarquia tipográfica fazem o trabalho visual.
- **Copy**: direta, em português claro, focada no que a pessoa faz ("Buscar professores", "Tentar novamente"). Sem promessas numéricas que ainda não medimos.

## 2. Cores

Definidas em `tailwind.config.ts`. Use sempre o nome do token, nunca o hexadecimal solto no componente.

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#00236f` | Marinho. Títulos, texto forte, fundo dos painéis escuros |
| `secondary` | `#0051d5` | Azul de ação. Botões principais, links, palavra de destaque no título |
| `ceu` | `#24a8d8` | Azul-claro da logo. Detalhes, ícones, gráficos |
| `menta` | `#1fc58e` | Verde da logo. Sucesso e status **Confirmada** |
| `ambar` | `#f59e0b` | Status **Solicitada** / pendente |
| `error` | `#ba1a1a` | Erros, status **Recusada** / **Cancelada** |
| `surface` | `#f6f8fd` | Fundo da página |
| `tinta` | `#0f172a` | Texto principal (slate-900) |
| `suave` | `#475569` | Texto secundário (slate-600; contraste AA sobre branco e `surface`) |

**Painel escuro**: `bg-primary` sólido (sem gradiente) com texto branco. Usado no máximo **uma vez por tela**, para o elemento mais importante.

### Status da aula

| Status | Selo |
|---|---|
| Solicitada | fundo `ambar/15`, texto `amber-800` |
| Confirmada | fundo `menta/15`, texto `emerald-800` |
| Remarcada | fundo `ceu/15`, texto `sky-800` |
| Recusada / Cancelada | fundo `error/10`, texto `error` |
| Realizada | fundo `slate-100`, texto `slate-700` |

## 3. Tipografia

Fonte única: **Plus Jakarta Sans** (400, 500, 600, 700, 800).

| Papel | Classes |
|---|---|
| Título da página inicial | `text-[2.25rem] sm:text-[3.25rem] font-extrabold tracking-tight leading-[1.08]` |
| Título de tela | `text-3xl sm:text-5xl font-extrabold tracking-tight` |
| Título de seção | `text-2xl sm:text-3xl font-extrabold tracking-tight` |
| Título de cartão | `text-lg font-bold` |
| Corpo | `text-base text-suave` |
| Número grande | `text-4xl font-extrabold tabular-nums` |

Regra do título: texto em `text-tinta`; **um trecho curto** pode ganhar `text-secondary` para dar ênfase ("agende sua **próxima aula.**"). No máximo um por tela.

## 4. Forma e espaço

- Cantos: cartões, painéis e barra de busca `rounded-2xl`; botões, campos e chips `rounded-xl`/`rounded-lg`; tags pequenas `rounded-md`. `rounded-full` só para avatares e selos de status.
- Separação por **borda fina**, não por sombra: cartões `border-slate-200`, botões secundários e campos `border-slate-300`. Sombra no máximo `shadow-sm`.
- Sem animação de "pular" no hover; o hover muda só a cor da borda ou do texto.
- Largura máxima do conteúdo: `max-w-6xl`, com margem lateral `px-4 sm:px-6`.
- Espaço entre seções: `py-16 sm:py-24`.

## 5. Componentes

- **Botão principal** (`.botao-principal`): `bg-secondary`, texto branco, `rounded-xl`, `h-12`, hover `bg-primary`.
- **Botão secundário** (`.botao-secundario`): branco, `border-slate-300`, texto `primary`.
- **Cartão** (`.cartao`): branco, `rounded-2xl`, `border-slate-200`.
- **Barra de busca**: retângulo branco com borda; matéria + nível + modalidade + botão. No celular os itens empilham.
- **Chips de matéria**: texto simples com borda, sem ícone; ao clicar, buscam pela matéria.
- **Cartão de professor**: avatar redondo de iniciais em tom suave, nome, modalidades, matérias em tags `rounded-md` azuis (`bg-secondary/10 text-secondary`, até 3 + "+N"), valor/hora e botão "Ver horários".
- **Ícones** (`lucide-react`, 16–20 px): só quando carregam informação (modalidade, ação de botão, status). Nunca como enfeite ao lado de títulos ou em listas de benefícios.

## 6. Acessibilidade e responsividade (RNF02, RNF05)

- Tudo funciona a partir de **360 px** de largura, sem rolagem horizontal.
- Todo campo tem `<label>` (pode ser `sr-only`).
- Foco visível: `focus-visible:ring-4 ring-secondary/30`.
- Texto sobre o painel azul: sempre branco ou `blue-100`.
- Áreas clicáveis com pelo menos 44 px de altura.
- Estados obrigatórios em listas que vêm da API: **carregando** (esqueleto), **vazio** e **erro** (com botão de tentar de novo).

## 7. Organização do código

```
src/
  pages/        telas (uma por rota), ex.: inicio.tsx
  components/   peças reutilizáveis, ex.: cartao-professor.tsx
  hooks/        hooks do TanStack Query, ex.: use-professores.ts
  services/     cliente da API (axios) e funções por recurso
```

Arquivos em kebab-case e componentes em PascalCase (Quadro 4 do Documento de Arquitetura).
