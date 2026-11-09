import { ErroProibido, ErroRegraNegocio } from '../../shared/errors';
import type { StatusAula } from '../../shared/types/dominio';

export type AtorDaTransicao = 'ALUNO' | 'PROFESSOR' | 'SISTEMA';

export interface TransicaoDeStatus {
  de: StatusAula;
  para: StatusAula;
  atores: AtorDaTransicao[];
}

export const TRANSICOES_DE_STATUS: TransicaoDeStatus[] = [
  { de: 'SOLICITADA', para: 'CONFIRMADA', atores: ['PROFESSOR'] },
  { de: 'SOLICITADA', para: 'RECUSADA', atores: ['PROFESSOR'] },
  { de: 'SOLICITADA', para: 'CANCELADA', atores: ['ALUNO'] },
  { de: 'CONFIRMADA', para: 'REMARCADA', atores: ['ALUNO', 'PROFESSOR'] },
  { de: 'REMARCADA', para: 'REMARCADA', atores: ['ALUNO', 'PROFESSOR'] },
  { de: 'CONFIRMADA', para: 'CANCELADA', atores: ['ALUNO', 'PROFESSOR'] },
  { de: 'REMARCADA', para: 'CANCELADA', atores: ['ALUNO', 'PROFESSOR'] },
  { de: 'CONFIRMADA', para: 'REALIZADA', atores: ['SISTEMA'] },
  { de: 'REMARCADA', para: 'REALIZADA', atores: ['SISTEMA'] },
];

export const STATUS_QUE_OCUPAM_HORARIO: StatusAula[] = ['CONFIRMADA', 'REMARCADA'];

export const STATUS_COM_CONTATO_LIBERADO: StatusAula[] = ['CONFIRMADA', 'REMARCADA', 'REALIZADA'];

export function validarTransicao(de: StatusAula, para: StatusAula, ator: AtorDaTransicao): void {
  const transicao = TRANSICOES_DE_STATUS.find((item) => item.de === de && item.para === para);
  if (!transicao) {
    throw new ErroRegraNegocio(
      `Não é possível mudar a aula de ${de} para ${para}`,
      'TRANSICAO_INVALIDA',
    );
  }
  if (!transicao.atores.includes(ator)) {
    throw new ErroProibido('Você não pode executar esta transição na aula');
  }
}
