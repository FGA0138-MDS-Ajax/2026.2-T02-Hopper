import { criarProximo, criarReq, criarRes } from '../../../tests/helpers/http';
import { ErroNaoAutenticado } from '../errors';
import { criarSeguranca } from '../utils/seguranca';

const SEGREDO = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';

jest.mock('../../config/env', () => ({
  env: { JWT_SECRET: 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres' },
}));

import { autenticar } from './autenticar';

describe('autenticar', () => {
  it('anexa o usuario do token valido', () => {
    const token = criarSeguranca({ segredoJwt: SEGREDO, expiracaoJwt: '1h' }).assinarToken({
      id: 'u1',
      perfil: 'ALUNO',
    });
    const req = criarReq({ headers: { authorization: `Bearer ${token}` } });
    const proximo = criarProximo();
    autenticar(req, criarRes(), proximo);
    expect(req.usuario).toEqual({ id: 'u1', perfil: 'ALUNO' });
    expect(proximo).toHaveBeenCalled();
  });

  it('recusa requisicao sem token ou com token invalido', () => {
    expect(() => autenticar(criarReq(), criarRes(), criarProximo())).toThrow(ErroNaoAutenticado);
    const req = criarReq({ headers: { authorization: 'Bearer lixo' } });
    expect(() => autenticar(req, criarRes(), criarProximo())).toThrow(ErroNaoAutenticado);
  });
});
