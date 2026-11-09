export const URL_BANCO_DE_TESTE =
  process.env.DATABASE_URL_TESTE ??
  'postgresql://aulacerta:aulacerta@localhost:5433/aulacerta_teste?schema=public';
