import { criarProximo, criarReq, criarRes } from '../../../tests/helpers/http';
import { ErroConflito, ErroValidacao } from '../errors';
import { rotaNaoEncontrada, tratarErros } from './tratar-erros';

describe('tratarErros', () => {
  it('converte AppError no formato padrao', () => {
    const res = criarRes();
    tratarErros(new ErroConflito('Duplicado', 'DUP'), criarReq(), res, criarProximo());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      erro: { codigo: 'DUP', mensagem: 'Duplicado', detalhes: null },
    });
  });

  it('inclui detalhes por campo em erros de validacao', () => {
    const res = criarRes();
    tratarErros(
      new ErroValidacao('Dados inválidos', [{ campo: 'nome', mensagem: 'Campo obrigatório' }]),
      criarReq(),
      res,
      criarProximo(),
    );
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json.mock.calls[0][0].erro.detalhes).toEqual([
      { campo: 'nome', mensagem: 'Campo obrigatório' },
    ]);
  });

  it('responde 400 para JSON malformado', () => {
    const res = criarRes();
    tratarErros({ type: 'entity.parse.failed' }, criarReq(), res, criarProximo());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].erro.codigo).toBe('JSON_INVALIDO');
  });

  it('converte violacao de exclusao em 409 de conflito de horario', () => {
    const res = criarRes();
    tratarErros({ cause: { originalCode: '23P01' } }, criarReq(), res, criarProximo());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].erro.codigo).toBe('CONFLITO_DE_HORARIO');
  });

  it('responde 500 sem expor detalhes de erros inesperados', () => {
    const silenciar = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = criarRes();
    tratarErros(new Error('segredo interno'), criarReq(), res, criarProximo());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('segredo interno');
    silenciar.mockRestore();
  });

  it('encaminha rota inexistente como 404', () => {
    const proximo = vi.fn();
    rotaNaoEncontrada(criarReq({ method: 'GET', path: '/xyz' }), criarRes(), proximo);
    expect(proximo.mock.calls[0][0].status).toBe(404);
  });
});
