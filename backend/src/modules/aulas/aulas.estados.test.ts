import { ErroProibido, ErroRegraNegocio } from '../../shared/errors';
import type { StatusAula } from '../../shared/types/dominio';
import { TRANSICOES_DE_STATUS, validarTransicao, type AtorDaTransicao } from './aulas.estados';

const TODOS_OS_STATUS: StatusAula[] = [
  'SOLICITADA',
  'CONFIRMADA',
  'RECUSADA',
  'REMARCADA',
  'CANCELADA',
  'REALIZADA',
];
const TODOS_OS_ATORES: AtorDaTransicao[] = ['ALUNO', 'PROFESSOR', 'SISTEMA'];

function capturar(operacao: () => void): unknown {
  try {
    operacao();
  } catch (erro) {
    return erro;
  }
  return undefined;
}

describe('maquina de estados da aula', () => {
  it('aceita cada transicao da tabela para os atores permitidos', () => {
    for (const transicao of TRANSICOES_DE_STATUS) {
      for (const ator of transicao.atores) {
        expect(() => validarTransicao(transicao.de, transicao.para, ator)).not.toThrow();
      }
    }
  });

  it('rejeita com 403 os atores nao permitidos em transicoes existentes', () => {
    for (const transicao of TRANSICOES_DE_STATUS) {
      for (const ator of TODOS_OS_ATORES.filter((item) => !transicao.atores.includes(item))) {
        expect(capturar(() => validarTransicao(transicao.de, transicao.para, ator))).toBeInstanceOf(
          ErroProibido,
        );
      }
    }
  });

  it('rejeita com 400 toda combinacao fora da tabela', () => {
    for (const de of TODOS_OS_STATUS) {
      for (const para of TODOS_OS_STATUS) {
        const existe = TRANSICOES_DE_STATUS.some((item) => item.de === de && item.para === para);
        if (existe) continue;
        for (const ator of TODOS_OS_ATORES) {
          const erro = capturar(() => validarTransicao(de, para, ator));
          expect(erro).toBeInstanceOf(ErroRegraNegocio);
          expect((erro as ErroRegraNegocio).codigo).toBe('TRANSICAO_INVALIDA');
        }
      }
    }
  });

  it('nao permite sair dos estados finais', () => {
    for (const final of ['RECUSADA', 'CANCELADA', 'REALIZADA'] as StatusAula[]) {
      expect(TRANSICOES_DE_STATUS.some((item) => item.de === final)).toBe(false);
    }
  });

  it('so o professor confirma ou recusa e so o aluno cancela uma solicitacao', () => {
    expect(() => validarTransicao('SOLICITADA', 'CONFIRMADA', 'PROFESSOR')).not.toThrow();
    expect(() => validarTransicao('SOLICITADA', 'RECUSADA', 'PROFESSOR')).not.toThrow();
    expect(() => validarTransicao('SOLICITADA', 'CANCELADA', 'ALUNO')).not.toThrow();
    expect(capturar(() => validarTransicao('SOLICITADA', 'CONFIRMADA', 'ALUNO'))).toBeInstanceOf(
      ErroProibido,
    );
    expect(capturar(() => validarTransicao('SOLICITADA', 'CANCELADA', 'PROFESSOR'))).toBeInstanceOf(
      ErroProibido,
    );
  });
});
