import { env } from '../config/env';
import { criarEnviadorBrevo, type MensagemEmail } from './brevo';

const VALIDADE_DO_LINK = '1 hora';

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** E-mail de recuperação de senha (RF03): versão em HTML e em texto simples. */
export function montarEmailRecuperacao(destino: string, link: string): MensagemEmail {
  const linkHtml = escaparHtml(link);
  return {
    para: destino,
    assunto: 'Redefina sua senha do AulaCerta',
    texto: [
      'Recebemos um pedido para redefinir a senha da sua conta no AulaCerta.',
      '',
      `Para criar uma nova senha, acesse o link abaixo (válido por ${VALIDADE_DO_LINK}):`,
      link,
      '',
      'Se você não fez esse pedido, ignore este e-mail. Sua senha continua a mesma.',
    ].join('\n'),
    html: `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f6f8fd;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px">
      <tr><td style="padding:32px">
        <p style="margin:0 0 24px;font-size:20px;font-weight:bold;color:#00236f">Aula<span style="color:#0051d5">Certa</span></p>
        <h1 style="margin:0 0 12px;font-size:22px">Redefina sua senha</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#475569">Recebemos um pedido para redefinir a senha da sua conta. O link é válido por ${VALIDADE_DO_LINK}.</p>
        <a href="${linkHtml}" style="display:inline-block;padding:14px 24px;background:#0051d5;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:12px">Criar nova senha</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#475569">Se o botão não funcionar, copie e cole este endereço no navegador:<br><a href="${linkHtml}" style="color:#0051d5;word-break:break-all">${linkHtml}</a></p>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#475569">Se você não fez esse pedido, ignore este e-mail. Sua senha continua a mesma.</p>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}

const enviarPeloBrevo = env.BREVO_API_KEY
  ? criarEnviadorBrevo({
      apiKey: env.BREVO_API_KEY,
      remetente: { nome: env.EMAIL_REMETENTE_NOME, email: env.EMAIL_REMETENTE },
    })
  : null;

export async function enviarEmailRecuperacao(destino: string, link: string): Promise<void> {
  if (!enviarPeloBrevo) {
    // Só acontece fora de produção (o env.ts exige BREVO_API_KEY em produção):
    // sem chave configurada, o link aparece no terminal para testar o fluxo localmente.
    console.info(
      `[e-mail não enviado: BREVO_API_KEY não configurada] Link de redefinição para ${destino}: ${link}`,
    );
    return;
  }
  await enviarPeloBrevo(montarEmailRecuperacao(destino, link));
}
