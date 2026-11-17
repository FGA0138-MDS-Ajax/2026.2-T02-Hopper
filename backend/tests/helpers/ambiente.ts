import { URL_BANCO_DE_TESTE } from './banco-de-teste';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = URL_BANCO_DE_TESTE;
process.env.JWT_SECRET = 'segredo-dos-testes-de-integracao-com-mais-de-32-caracteres';
process.env.JWT_EXPIRES_IN = '2h';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.FRONTEND_URL = 'http://localhost:5173';
// Os testes nunca enviam e-mail de verdade: o app de teste recebe um enviador falso
// (helpers/app.ts). A chave vazia garante isso mesmo se o .env tiver uma chave real do Brevo.
process.env.BREVO_API_KEY = '';
process.env.EMAIL_REMETENTE = 'nao-responda@aulacerta.com.br';
process.env.EMAIL_REMETENTE_NOME = 'AulaCerta';
