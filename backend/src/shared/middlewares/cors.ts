import cors from 'cors';
import helmet from 'helmet';
import { env } from '../../config/env';

export const middlewareCors = cors({
  origin: (origem, retorno) => {
    retorno(null, origem === undefined || origem === env.CORS_ORIGIN);
  },
});

export const middlewareHelmet = helmet();
