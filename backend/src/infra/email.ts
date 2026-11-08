import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transportador = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export async function enviarEmailRecuperacao(destino: string, link: string): Promise<void> {
  await transportador.sendMail({
    from: env.SMTP_FROM,
    to: destino,
    subject: 'Recuperação de senha - AulaCerta',
    text: `Recebemos um pedido para redefinir sua senha.\n\nAcesse o link abaixo (válido por 1 hora):\n${link}\n\nSe você não fez o pedido, ignore esta mensagem.`,
    html: `<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="${link}">Redefinir senha</a> (válido por 1 hora)</p><p>Se você não fez o pedido, ignore esta mensagem.</p>`,
  });
}
