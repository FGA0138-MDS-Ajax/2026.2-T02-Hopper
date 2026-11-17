import { z } from 'zod';
import '../../config/zod-ptbr';
import { criarProximo, criarReq, criarRes } from '../../../tests/helpers/http';
import { ErroValidacao } from '../errors';
import { lerConsulta, validar } from './validar';

describe('validar', () => {
  it('substitui params e body pelos dados convertidos', () => {
    const req = criarReq({ params: { id: '7' }, body: { nome: ' Ana ' } });
    const proximo = criarProximo();
    validar({
      params: z.object({ id: z.coerce.number() }),
      body: z.object({ nome: z.string().trim() }),
    })(req, criarRes(), proximo);
    expect(req.params).toEqual({ id: 7 });
    expect(req.body).toEqual({ nome: 'Ana' });
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

describe('lerConsulta', () => {
  const esquema = z.object({
    pagina: z.coerce.number().int().min(1),
    ativo: z.enum(['sim', 'nao']),
  });

  it('devolve a query convertida e tipada pelo esquema', () => {
    const req = criarReq({ query: { pagina: '2', ativo: 'sim' } });
    const consulta = lerConsulta(req, esquema);
    expect(consulta).toEqual({ pagina: 2, ativo: 'sim' });
  });

  it('lanca ErroValidacao com o campo prefixado por query', () => {
    const req = criarReq({ query: { pagina: '0', ativo: 'talvez' } });
    let erro: ErroValidacao | undefined;
    try {
      lerConsulta(req, esquema);
    } catch (e) {
      erro = e as ErroValidacao;
    }
    expect(erro).toBeInstanceOf(ErroValidacao);
    expect(erro?.status).toBe(422);
    expect(erro?.detalhes).toEqual([
      { campo: 'query.pagina', mensagem: 'Deve ser maior ou igual a 1' },
      { campo: 'query.ativo', mensagem: 'Valor inválido. Opções: sim, nao' },
    ]);
  });
});
