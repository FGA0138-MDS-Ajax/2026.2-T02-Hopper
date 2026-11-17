/**
 * Envio de e-mails transacionais pela API HTTP do Brevo.
 * Usa HTTPS (porta 443) em vez de SMTP: hospedagens gratuitas como o Render bloqueiam as portas de SMTP.
 * Documentação: https://developers.brevo.com/reference/sendtransacemail
 */

export const URL_API_BREVO = 'https://api.brevo.com/v3/smtp/email';

export interface MensagemEmail {
  para: string;
  assunto: string;
  html: string;
  texto: string;
}

export interface ConfiguracaoBrevo {
  apiKey: string;
  remetente: { nome: string; email: string };
  /** Injetável para os testes; por padrão, o fetch nativo do Node. */
  fetch?: typeof fetch;
}

export class ErroEnvioEmail extends Error {
  constructor(
    mensagem: string,
    readonly status?: number,
  ) {
    super(mensagem);
    this.name = 'ErroEnvioEmail';
  }
}

export function criarEnviadorBrevo(configuracao: ConfiguracaoBrevo) {
  const requisitar = configuracao.fetch ?? fetch;

  return async function enviar(mensagem: MensagemEmail): Promise<void> {
    const resposta = await requisitar(URL_API_BREVO, {
      method: 'POST',
      headers: {
        'api-key': configuracao.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: configuracao.remetente.nome, email: configuracao.remetente.email },
        to: [{ email: mensagem.para }],
        subject: mensagem.assunto,
        htmlContent: mensagem.html,
        textContent: mensagem.texto,
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => '');
      throw new ErroEnvioEmail(
        `O Brevo recusou o envio (HTTP ${resposta.status}): ${detalhe}`,
        resposta.status,
      );
    }
  };
}
