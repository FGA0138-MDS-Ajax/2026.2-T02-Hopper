import { criarProximo, criarReq, criarRes } from '../../../tests/helpers/http';
import { ErroNaoAutenticado, ErroProibido } from '../errors';
import { autorizar } from './autorizar';

describe('autorizar', () => {
  it('libera perfil permitido', () => {
    const proximo = criarProximo();
    autorizar('PROFESSOR')(
      criarReq({ usuario: { id: 'u1', perfil: 'PROFESSOR' } }),
      criarRes(),
      proximo,
    );
    expect(proximo).toHaveBeenCalled();
  });

  it('bloqueia perfil nao permitido com 403', () => {
    const req = criarReq({ usuario: { id: 'u1', perfil: 'ALUNO' } });
    expect(() => autorizar('PROFESSOR')(req, criarRes(), criarProximo())).toThrow(ErroProibido);
  });

  it('exige usuario autenticado', () => {
    expect(() => autorizar('ALUNO')(criarReq(), criarRes(), criarProximo())).toThrow(
      ErroNaoAutenticado,
    );
  });
});
