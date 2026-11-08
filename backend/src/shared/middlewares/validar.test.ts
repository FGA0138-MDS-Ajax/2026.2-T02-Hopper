import { z } from 'zod';
import '../../config/zod-ptbr';
import { criarProximo, criarReq, criarRes } from '../../../tests/helpers/http';
import { ErroValidacao } from '../errors';
import { validar } from './validar';

describe('validar', () => {
  it('substitui body e query pelos dados convertidos', () => {
    const req = criarReq({ body: { nome: 'Ana' }, query: { pagina: '2' } as never });
    const proximo = criarProximo();
    validar({
      body: z.object({ nome: z.string() }),
      query: z.object({ pagina: z.coerce.number() }),
    })(req, criarRes(), proximo);
    expect(req.query).toEqual({ pagina: 2 });
    expect(proximo).toHaveBeenCalled();
  });

  it('lanca ErroValidacao com detalhes por campo', () => {
    const req = criarReq({ body: {} });
    let erro: ErroValidacao | undefined;
    try {
      validar({ body: z.object({ nome: z.string() }) })(req, criarRes(), criarProximo());
    } catch (e) {
      erro = e as ErroValidacao;
    }
    expect(erro).toBeInstanceOf(ErroValidacao);
    expect(erro?.status).toBe(422);
    expect(erro?.detalhes).toEqual([{ campo: 'body.nome', mensagem: 'Campo obrigatório' }]);
  });
});
