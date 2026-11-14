import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

W, H = 2055, 1395
fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, W); ax.set_ylim(H, 0); ax.axis("off")

AZUL, AZUL_FUNDO, MARINHO = "#2e75b6", "#dde8f4", "#1f3864"
VERDE, VERDE_FUNDO = "#538135", "#e2efda"
CINZA = "#404040"

def caixa(x1, y1, x2, y2, fundo, borda, lw=2.2):
    ax.add_patch(FancyBboxPatch((x1, y1), x2 - x1, y2 - y1, boxstyle="round,pad=0,rounding_size=4",
                                facecolor=fundo, edgecolor=borda, linewidth=lw))

def bloco(x1, y1, x2, y2, texto, fundo=AZUL_FUNDO, borda=AZUL, tam=16):
    caixa(x1, y1, x2, y2, fundo, borda)
    ax.text((x1 + x2) / 2, (y1 + y2) / 2, texto, ha="center", va="center", fontsize=tam, color="#262626", linespacing=1.15)

def titulo(x, y, texto):
    ax.text(x, y, texto, ha="left", va="center", fontsize=19, fontweight="bold", color=MARINHO)

def seta(p1, p2, curva=0.0):
    ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=22, color=CINZA, linewidth=2.4,
                                 connectionstyle=f"arc3,rad={curva}", shrinkA=0, shrinkB=0))

def rotulo(x, y, texto):
    ax.text(x, y, texto, ha="center", va="center", fontsize=15, style="italic", color=CINZA,
            bbox=dict(facecolor="white", edgecolor="none", pad=2))

# Camada de apresentação
caixa(43, 43, 1503, 295, "#f5f9fd", AZUL, 2.6)
titulo(68, 77, "Camada de Apresentação (cliente): SPA React + TypeScript + Tailwind CSS")
bloco(90, 112, 492, 256, "Páginas e componentes\n(telas de visitante,\naluno e professor)")
bloco(557, 112, 959, 256, "Estado e cache\n(TanStack Query)")
bloco(1025, 112, 1457, 256, "Cliente HTTP\n(Axios, token JWT)")
seta((496, 184), (552, 184)); seta((963, 184), (1020, 184))

# Servidor
caixa(43, 373, 1503, 1134, "#f9f9f9", MARINHO, 2.6)
titulo(68, 406, "API REST: Node.js + Express + TypeScript (servidor)")

caixa(89, 448, 1458, 639, VERDE_FUNDO, VERDE, 2.6)
titulo(113, 481, "Camada de Interface (entrada)")
bloco(135, 509, 718, 615, "Rotas e controladores REST\n(/api/v1/...)")
bloco(829, 509, 1412, 615, "Middlewares: Helmet e CORS, limite de tentativas,\nautenticação JWT, autorização por perfil,\nvalidação (Zod), tratamento de erros", tam=14.5)
seta((825, 563), (723, 563))

caixa(89, 673, 1458, 879, VERDE_FUNDO, VERDE, 2.6)
titulo(113, 706, "Camada de Negócio")
bloco(135, 734, 627, 855, "Serviços de domínio: autenticação,\nusuários, agenda e aulas (regras,\nconflito de horário, status)", tam=14.5)
bloco(693, 734, 1034, 855, "Notificações\n(na aplicação; lembretes\nsob demanda)", tam=14.5)
bloco(1101, 734, 1412, 855, "Envio de e-mail\n(recuperação\nde senha)", tam=14.5)
seta((517, 620), (517, 728))
seta((631, 796), (688, 796))
seta((597, 732), (1158, 732), curva=-0.12)

caixa(89, 912, 1458, 1104, VERDE_FUNDO, VERDE, 2.6)
titulo(113, 945, "Camada de Dados")
bloco(406, 966, 1140, 1080, "Repositórios (Prisma ORM): acesso aos dados,\ntransações e migrações")
seta((355, 858), (587, 962)); seta((864, 860), (864, 960))

# Entrada pela rede, banco e serviço externo
seta((1226, 260), (1226, 504)); rotulo(1226, 340, "HTTPS / JSON (REST)")
bloco(497, 1184, 1049, 1312, "PostgreSQL (Neon)\nrestrição de exclusão e transações", fundo="#fff2cc", borda="#bf9000")
seta((773, 1085), (773, 1178)); ax.text(800, 1160, "SQL sobre TLS", fontsize=15, style="italic", color=CINZA, va="center")
bloco(1613, 719, 1954, 892, "Brevo\n(API HTTP de e-mail:\nrecuperação de senha)", fundo="#f2f2f2", borda="#808080", tam=15)
seta((1416, 796), (1607, 803)); ax.text(1511, 765, "HTTPS", fontsize=15, style="italic", color=CINZA, ha="center", va="center")

fig.savefig(sys.argv[1], dpi=100, facecolor="white")
