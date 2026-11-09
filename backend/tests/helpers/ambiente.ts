import { URL_BANCO_DE_TESTE } from './banco-de-teste';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = URL_BANCO_DE_TESTE;
process.env.JWT_SECRET = 'segredo-dos-testes-de-integracao-com-mais-de-32-caracteres';
process.env.JWT_EXPIRES_IN = '2h';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_USER = 'usuario';
process.env.SMTP_PASS = 'senha';
process.env.SMTP_FROM = 'AulaCerta <nao-responda@aulacerta.com.br>';
process.env.FRONTEND_URL = 'http://localhost:5173';
