import { ErroNaoEncontrado, ErroProibido, ErroRegraNegocio } from '../../shared/errors';
import type { FaixaHoraria, Intervalo } from '../../shared/types/dominio';
import {
  faixasSeSobrepoem,
  gerarHorariosLivres,
  intervaloCabeNaGrade,
  intervalosSobrepoem,
} from '../../shared/utils/datas';
import type { AgendaRepositorio, BloqueioDados } from './agenda.repository';
import type { EntradaCriarBloqueio, EntradaSubstituirGrade } from './agenda.schemas';

export interface ProvedorDeOcupacao {
  listarIntervalosOcupados(professorId: string, de: Date, ate: Date): Promise<Intervalo[]>;
}

export interface DependenciasAgendaService {
  repositorio: AgendaRepositorio;
  ocupacao: ProvedorDeOcupacao;
  agora?: () => Date;
}

export class AgendaService {
  constructor(private readonly deps: DependenciasAgendaService) {}

  async obterGrade(usuarioId: string): Promise<FaixaHoraria[]> {
    const professorId = await this.exigirProfessorId(usuarioId);
    return this.deps.repositorio.listarGrade(professorId);
  }

  async substituirGrade(
    usuarioId: string,
    entrada: EntradaSubstituirGrade,
  ): Promise<FaixaHoraria[]> {
    const professorId = await this.exigirProfessorId(usuarioId);
    if (faixasSeSobrepoem(entrada.faixas)) {
      throw new ErroRegraNegocio(
        'As faixas de horário não podem se sobrepor no mesmo dia',
        'FAIXAS_SOBREPOSTAS',
      );
    }
    await this.deps.repositorio.substituirGrade(professorId, entrada.faixas);
    return this.deps.repositorio.listarGrade(professorId);
  }

  async listarBloqueios(usuarioId: string): Promise<BloqueioDados[]> {
    const professorId = await this.exigirProfessorId(usuarioId);
    return this.deps.repositorio.listarBloqueiosFuturos(professorId, this.agora());
  }

  async criarBloqueio(usuarioId: string, entrada: EntradaCriarBloqueio): Promise<BloqueioDados> {
    const professorId = await this.exigirProfessorId(usuarioId);
    if (entrada.inicio.getTime() <= this.agora().getTime()) {
      throw new ErroRegraNegocio('O bloqueio deve começar no futuro', 'BLOQUEIO_NO_PASSADO');
    }
    return this.deps.repositorio.criarBloqueio(professorId, {
      inicio: entrada.inicio,
      fim: entrada.fim,
      motivo: entrada.motivo ?? null,
    });
  }

  async removerBloqueio(usuarioId: string, bloqueioId: string): Promise<void> {
    const professorId = await this.exigirProfessorId(usuarioId);
    const bloqueio = await this.deps.repositorio.buscarBloqueio(bloqueioId);
    if (!bloqueio)
      throw new ErroNaoEncontrado('Bloqueio não encontrado', 'BLOQUEIO_NAO_ENCONTRADO');
    if (bloqueio.professorId !== professorId) {
      throw new ErroProibido('Este bloqueio pertence a outro professor');
    }
    await this.deps.repositorio.removerBloqueio(bloqueioId);
  }

  async calcularHorariosLivres(professorId: string, de: Date, ate: Date): Promise<Intervalo[]> {
    const [grade, bloqueios, ocupados] = await Promise.all([
      this.deps.repositorio.listarGrade(professorId),
      this.deps.repositorio.listarIntervalosBloqueados(professorId, de, ate),
      this.deps.ocupacao.listarIntervalosOcupados(professorId, de, ate),
    ]);
    return gerarHorariosLivres({ grade, bloqueios, ocupados, de, ate, agora: this.agora() });
  }

  async estaLivre(professorId: string, inicio: Date, fim: Date): Promise<boolean> {
    if (inicio.getTime() >= fim.getTime() || inicio.getTime() <= this.agora().getTime()) {
      return false;
    }
    const intervalo = { inicio, fim };
    const [grade, bloqueios, ocupados] = await Promise.all([
      this.deps.repositorio.listarGrade(professorId),
      this.deps.repositorio.listarIntervalosBloqueados(professorId, inicio, fim),
      this.deps.ocupacao.listarIntervalosOcupados(professorId, inicio, fim),
    ]);
    if (!intervaloCabeNaGrade(grade, intervalo)) return false;
    return ![...bloqueios, ...ocupados].some((item) => intervalosSobrepoem(intervalo, item));
  }

  private async exigirProfessorId(usuarioId: string): Promise<string> {
    const professorId = await this.deps.repositorio.buscarProfessorIdPorUsuario(usuarioId);
    if (!professorId) {
      throw new ErroNaoEncontrado('Perfil de professor não encontrado', 'PROFESSOR_NAO_ENCONTRADO');
    }
    return professorId;
  }

  private agora(): Date {
    return this.deps.agora ? this.deps.agora() : new Date();
  }
}
