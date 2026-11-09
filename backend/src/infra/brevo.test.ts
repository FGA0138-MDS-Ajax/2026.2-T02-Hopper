import { criarEnviadorBrevo, ErroEnvioEmail, URL_API_BREVO } from './brevo';

const MENSAGEM = {
  para: 'caio@email.com',
  assunto: 'Assunto',
  html: '<p>Olá</p>',
  texto: 'Olá',
};

function respostaFalsa(status: number, corpo = ''): Response {
  return new Response(corpo, { status });
}

describe('envio de e-mail pelo Brevo', () => {
  it('chama a API transacional com a chave, o remetente e a mensagem', async () => {
    const fetchFalso = jest.fn().mockResolvedValue(respostaFalsa(201, '{"messageId":"1"}'));
    const enviar = criarEnviadorBrevo({
      apiKey: 'chave-de-teste',
      remetente: { nome: 'AulaCerta', email: 'nao-responda@aulacerta.com.br' },
      fetch: fetchFalso,
    });

    await enviar(MENSAGEM);

    expect(fetchFalso).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(URL_API_BREVO);
    expect(opcoes.method).toBe('POST');
    expect(opcoes.headers).toMatchObject({
      'api-key': 'chave-de-teste',
      'content-type': 'application/json',
    });
    expect(JSON.parse(opcoes.body as string)).toEqual({
      sender: { name: 'AulaCerta', email: 'nao-responda@aulacerta.com.br' },
      to: [{ email: 'caio@email.com' }],
      subject: 'Assunto',
      htmlContent: '<p>Olá</p>',
      textContent: 'Olá',
    });
  });

  it('falha com o status e o motivo quando o Brevo recusa', async () => {
    const fetchFalso = jest
      .fn()
      .mockResolvedValue(respostaFalsa(401, '{"message":"Key not found"}'));
    const enviar = criarEnviadorBrevo({
      apiKey: 'chave-errada',
      remetente: { nome: 'AulaCerta', email: 'nao-responda@aulacerta.com.br' },
      fetch: fetchFalso,
    });

    const erro = await enviar(MENSAGEM).catch((falha: unknown) => falha);
    expect(erro).toBeInstanceOf(ErroEnvioEmail);
    expect((erro as ErroEnvioEmail).status).toBe(401);
    expect((erro as ErroEnvioEmail).message).toContain('Key not found');
  });
});
