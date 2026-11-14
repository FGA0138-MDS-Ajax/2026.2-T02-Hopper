import { randomUUID } from 'crypto';
import type { Transacao } from '../../infra/prisma';
import {
  ErroConflito,
  ErroNaoEncontrado,
  ErroProibido,
  ErroRegraNegocio,
} from '../../shared/errors';
import type { Intervalo, Pagina, UsuarioAutenticado } from '../../shared/types/dominio';
import { formatarDataHoraBrasilia, somarMinutos } from '../../shared/utils/datas';
import { calcularPaginacao, montarPagina } from '../../shared/utils/paginacao';
import type { EntradaNotificar } from '../notificacoes/notificacoes.service';
import type { ContatoUsuario, ProfessorParaAula } from '../usuarios/usuarios.service';
import { STATUS_COM_CONTATO_LIBERADO, validarTransicao } from './aulas.estados';
import type {
  AulaDetalhe,
  AulaResumo,
  AulasRepositorio,
  FiltroListagemAulas,
} from './aulas.repository';
import type { EntradaCriarAula, EntradaListarAulas } from './aulas.schemas';

export interface ServicoDeUsuariosParaAulas {
  obterProfessorParaAula(professorId: string): Promise<ProfessorParaAula>;
  obterProfessorIdPorUsuario(usuarioId: string): Promise<string>;
  obterContato(usuarioId: string): Promise<ContatoUsuario>;
}

export interface ServicoDeAgendaParaAulas {
  estaLivre(professorId: string, inicio: Date, fim: Date): Promise<boolean>;
}

export interface ServicoDeNotificacoesParaAulas {
  notificar(tx: Transacao, entrada: EntradaNotificar): Promise<void>;
}

export type ExecutarEmTransacao = <T>(operacao: (tx: Transacao) => Promise<T>) => Promise<T>;

export interface DependenciasAulasService {
  repositorio: AulasRepositorio;
  usuarios: ServicoDeUsuariosParaAulas;
  agenda: ServicoDeAgendaParaAulas;
  notificacoes: ServicoDeNotificacoesParaAulas;
  transacao: ExecutarEmTransacao;
  agora?: () => Date;
  gerarId?: () => string;
}

export interface ContatoDaAula extends ContatoUsuario {
  nome: string;
}

export interface AulaComContato extends AulaDetalhe {
  contato: ContatoDaAula | null;
}

type PapelNaAula = 'ALUNO' | 'PROFESSOR';

const MINUTOS_POR_SEMANA = 7 * 24 * 60;

/** Motivo gravado no histórico dos pedidos recusados quando outro pedido ocupa o horário. */
const MOTIVO_HORARIO_PREENCHIDO = 'O horário foi preenchido por outra aula';

export class AulasService {
  constructor(private readonly deps: DependenciasAulasService) {}

  async solicitar(aluno: UsuarioAutenticado, entrada: EntradaCriarAula): Promise<AulaResumo[]> {
    if (entrada.inicio.getTime() <= this.agora().getTime()) {
      throw new ErroRegraNegocio('A aula deve começar no futuro', 'AULA_NO_PASSADO');
    }
    const professor = await this.deps.usuarios.obterProfessorParaAula(entrada.professorId);
    if (!professor.ativo) {
      throw new ErroNaoEncontrado('Professor não encontrado', 'PROFESSOR_NAO_ENCONTRADO');
    }
    if (!professor.materiaIds.includes(entrada.materiaId)) {
      throw new ErroRegraNegocio('O professor não oferece esta matéria', 'MATERIA_NAO_OFERECIDA');
    }
    if (!professor.modalidades.includes(entrada.modalidade)) {
      throw new ErroRegraNegocio(
        'O professor não oferece esta modalidade',
        'MODALIDADE_NAO_OFERECIDA',
      );
    }
    const ocorrencias = this.montarOcorrencias(entrada);
    const disponibilidade = await Promise.all(
      ocorrencias.map((ocorrencia) =>
        this.deps.agenda.estaLivre(professor.id, ocorrencia.inicio, ocorrencia.fim),
      ),
    );
    const indiceIndisponivel = disponibilidade.findIndex((livre) => !livre);
    if (indiceIndisponivel >= 0) {
      const mensagem =
        ocorrencias.length === 1
          ? 'O horário escolhido não está disponível'
          : `O horário de ${formatarDataHoraBrasilia(ocorrencias[indiceIndisponivel].inicio)} não está disponível`;
      throw new ErroConflito(mensagem, 'HORARIO_INDISPONIVEL');
    }
    const serieId = ocorrencias.length > 1 ? this.gerarId() : null;
    return this.deps.transacao(async (tx) => {
      const aulas = await this.deps.repositorio.criarAulas(
        tx,
        ocorrencias.map((ocorrencia) => ({
          alunoId: aluno.id,
          professorId: professor.id,
          materiaId: entrada.materiaId,
          inicio: ocorrencia.inicio,
          fim: ocorrencia.fim,
          modalidade: entrada.modalidade,
          objetivo: entrada.objetivo ?? null,
          serieId,
        })),
        aluno.id,
      );
      const [primeira] = aulas;
      const dataInicial = formatarDataHoraBrasilia(primeira.inicio);
      const mensagem =
        aulas.length === 1
          ? `${primeira.aluno.nome} solicitou uma aula de ${primeira.materia.nome} em ${dataInicial}.`
          : `${primeira.aluno.nome} solicitou ${aulas.length} aulas semanais de ${primeira.materia.nome} a partir de ${dataInicial}.`;
      await this.deps.notificacoes.notificar(tx, {
        usuarioId: professor.usuarioId,
        aulaId: primeira.id,
        tipo: 'SOLICITACAO',
        mensagem,
      });
      return aulas;
    });
  }

  async listar(
    usuario: UsuarioAutenticado,
    consulta: EntradaListarAulas,
  ): Promise<Pagina<AulaResumo>> {
    const { status, de, ate, pagina, limite } = consulta;
    const filtro: FiltroListagemAulas = { status, de, ate };
    if (usuario.perfil === 'ALUNO') {
      filtro.alunoId = usuario.id;
    } else if (usuario.perfil === 'PROFESSOR') {
      filtro.professorId = await this.deps.usuarios.obterProfessorIdPorUsuario(usuario.id);
    } else {
      throw new ErroProibido('Seu perfil não possui aulas');
    }
    const resultado = await this.deps.repositorio.listar(
      filtro,
      calcularPaginacao({ pagina, limite }),
    );
    return montarPagina(resultado.itens, resultado.total, pagina);
  }

  async obterDetalhe(usuario: UsuarioAutenticado, aulaId: string): Promise<AulaComContato> {
    const aula = await this.carregarAula(aulaId);
    const papel = this.exigirParticipante(aula, usuario);
    if (!STATUS_COM_CONTATO_LIBERADO.includes(aula.status)) return { ...aula, contato: null };
    const outroUsuarioId = papel === 'ALUNO' ? aula.professor.usuarioId : aula.aluno.id;
    const outroNome = papel === 'ALUNO' ? aula.professor.nome : aula.aluno.nome;
    const contato = await this.deps.usuarios.obterContato(outroUsuarioId);
    return { ...aula, contato: { nome: outroNome, ...contato } };
  }

  /**
   * RF11/RF12: confirma o pedido e bloqueia o horário. Com { serie: true }, confirma também os
   * demais pedidos pendentes da mesma série semanal (RF10): todos ou nenhum. Os outros pedidos
   * pendentes para o mesmo horário deixam de ser possíveis e são recusados automaticamente.
   */
  async aceitar(
    professor: UsuarioAutenticado,
    aulaId: string,
    opcoes: { serie?: boolean } = {},
  ): Promise<AulaComContato> {
    const aula = await this.carregarAula(aulaId);
    this.exigirProfessorDaAula(aula, professor);
    validarTransicao(aula.status, 'CONFIRMADA', 'PROFESSOR');
    if (aula.inicio.getTime() <= this.agora().getTime()) {
      throw new ErroRegraNegocio('A aula já passou e não pode ser confirmada', 'AULA_NO_PASSADO');
    }
    const aulas = await this.aulasParaConfirmar(aula, opcoes.serie === true);
    const idsConfirmados = aulas.map((item) => item.id);

    await this.deps.transacao(async (tx) => {
      // Confere todas antes de confirmar qualquer uma: numa série, ou entram todas ou nenhuma.
      for (const item of aulas) {
        const intervalo = { inicio: item.inicio, fim: item.fim };
        if (await this.deps.repositorio.existeConflito(tx, item.professor.id, intervalo, item.id)) {
          throw new ErroConflito(
            aulas.length === 1
              ? 'Já existe uma aula confirmada neste horário'
              : `Já existe uma aula confirmada em ${formatarDataHoraBrasilia(item.inicio)}`,
            'CONFLITO_DE_HORARIO',
          );
        }
      }
      for (const item of aulas) {
        await this.deps.repositorio.transicionar(tx, {
          aulaId: item.id,
          de: 'SOLICITADA',
          para: 'CONFIRMADA',
          autorId: professor.id,
        });
      }
      for (const item of aulas) {
        await this.recusarPedidosSobrepostos(tx, professor, item, idsConfirmados);
      }
      const inicio = formatarDataHoraBrasilia(aula.inicio);
      await this.deps.notificacoes.notificar(tx, {
        usuarioId: aula.aluno.id,
        aulaId: aula.id,
        tipo: 'CONFIRMACAO',
        mensagem:
          aulas.length === 1
            ? `${aula.professor.nome} confirmou a sua aula de ${aula.materia.nome} em ${inicio}.`
            : `${aula.professor.nome} confirmou ${aulas.length} aulas semanais de ${aula.materia.nome} a partir de ${inicio}.`,
      });
    });
    return this.obterDetalhe(professor, aula.id);
  }

  async recusar(
    professor: UsuarioAutenticado,
    aulaId: string,
    motivo?: string,
  ): Promise<AulaComContato> {
    const aula = await this.carregarAula(aulaId);
    this.exigirProfessorDaAula(aula, professor);
    validarTransicao(aula.status, 'RECUSADA', 'PROFESSOR');
    await this.deps.transacao(async (tx) => {
      await this.deps.repositorio.transicionar(tx, {
        aulaId: aula.id,
        de: aula.status,
        para: 'RECUSADA',
        autorId: professor.id,
        motivo: motivo ?? null,
      });
      const complemento = motivo ? ` Motivo: ${motivo}` : '';
      await this.deps.notificacoes.notificar(tx, {
        usuarioId: aula.aluno.id,
        aulaId: aula.id,
        tipo: 'RECUSA',
        mensagem: `${aula.professor.nome} recusou a sua aula de ${aula.materia.nome} em ${formatarDataHoraBrasilia(aula.inicio)}.${complemento}`,
      });
    });
    return this.obterDetalhe(professor, aula.id);
  }

  /** A aula escolhida e, se pedido, os demais pedidos pendentes da série (sempre incluindo a escolhida). */
  private async aulasParaConfirmar(aula: AulaDetalhe, serie: boolean): Promise<AulaResumo[]> {
    if (!serie || !aula.serieId) return [aula];
    const daSerie = await this.deps.repositorio.listarPedidosDaSerie(aula.serieId, this.agora());
    return daSerie.some((item) => item.id === aula.id) ? daSerie : [aula, ...daSerie];
  }

  private async recusarPedidosSobrepostos(
    tx: Transacao,
    professor: UsuarioAutenticado,
    confirmada: AulaResumo,
    idsConfirmados: string[],
  ): Promise<void> {
    const pedidos = await this.deps.repositorio.listarPedidosSobrepostos(
      tx,
      confirmada.professor.id,
      { inicio: confirmada.inicio, fim: confirmada.fim },
      idsConfirmados,
    );
    for (const pedido of pedidos) {
      await this.deps.repositorio.transicionar(tx, {
        aulaId: pedido.id,
        de: 'SOLICITADA',
        para: 'RECUSADA',
        autorId: professor.id,
        motivo: MOTIVO_HORARIO_PREENCHIDO,
      });
      await this.deps.notificacoes.notificar(tx, {
        usuarioId: pedido.aluno.id,
        aulaId: pedido.id,
        tipo: 'RECUSA',
        mensagem: `${pedido.professor.nome} recusou a sua aula de ${pedido.materia.nome} em ${formatarDataHoraBrasilia(pedido.inicio)}. Motivo: o horário foi preenchido por outra aula.`,
      });
    }
  }

  listarIntervalosOcupados(professorId: string, de: Date, ate: Date): Promise<Intervalo[]> {
    return this.deps.repositorio.listarIntervalosOcupados(professorId, de, ate);
  }

  private montarOcorrencias(entrada: EntradaCriarAula): Intervalo[] {
    const semanas = entrada.recorrencia?.semanas ?? 1;
    return Array.from({ length: semanas }, (_, indice) => ({
      inicio: somarMinutos(entrada.inicio, indice * MINUTOS_POR_SEMANA),
      fim: somarMinutos(entrada.fim, indice * MINUTOS_POR_SEMANA),
    }));
  }

  private gerarId(): string {
    return this.deps.gerarId ? this.deps.gerarId() : randomUUID();
  }

  private async carregarAula(aulaId: string): Promise<AulaDetalhe> {
    const aula = await this.deps.repositorio.buscarPorId(aulaId);
    if (!aula) throw new ErroNaoEncontrado('Aula não encontrada', 'AULA_NAO_ENCONTRADA');
    return aula;
  }

  private exigirParticipante(aula: AulaDetalhe, usuario: UsuarioAutenticado): PapelNaAula {
    if (usuario.perfil === 'ALUNO' && aula.aluno.id === usuario.id) return 'ALUNO';
    if (usuario.perfil === 'PROFESSOR' && aula.professor.usuarioId === usuario.id) {
      return 'PROFESSOR';
    }
    throw new ErroProibido('Esta aula pertence a outros usuários');
  }

  private exigirProfessorDaAula(aula: AulaDetalhe, usuario: UsuarioAutenticado): void {
    if (this.exigirParticipante(aula, usuario) !== 'PROFESSOR') {
      throw new ErroProibido('Somente o professor da aula pode executar esta operação');
    }
  }

  private agora(): Date {
    return this.deps.agora ? this.deps.agora() : new Date();
  }
}
