import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { api } from '../services/api';

/** Uma requisição feita ao cliente HTTP durante o teste. */
export interface Chamada {
  metodo: string;
  url: string;
  params: unknown;
  corpo: unknown;
}

/** Corpo fixo da resposta, ou uma função que monta a resposta a partir da chamada. */
type Resposta = Record<string, unknown> | unknown[] | ((chamada: Chamada) => unknown);

/**
 * Troca o adaptador do axios por um que não vai à rede: registra cada chamada (método, rota,
 * parâmetros e corpo) e responde 200 com a resposta informada (ou calculada a partir da chamada).
 * Chame restaurar() no afterEach.
 */
export function simularApi(resposta: Resposta = {}) {
  const chamadas: Chamada[] = [];
  const adaptadorOriginal = api.defaults.adapter;
  api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const chamada: Chamada = {
      metodo: (config.method ?? 'get').toUpperCase(),
      url: config.url ?? '',
      params: config.params,
      corpo: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    };
    chamadas.push(chamada);
    const data = typeof resposta === 'function' ? resposta(chamada) : resposta;
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  };
  return {
    chamadas,
    /** A única chamada feita (falha se houve zero ou mais de uma). */
    unica(): Chamada {
      if (chamadas.length !== 1) throw new Error(`Esperava 1 chamada à API, houve ${chamadas.length}`);
      return chamadas[0];
    },
    restaurar() {
      api.defaults.adapter = adaptadorOriginal;
    },
  };
}
