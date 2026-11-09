import { useEffect } from 'react';

const NOME = 'AulaCerta';

/** Define o título da aba do navegador para a página atual. */
export function useTitulo(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} — ${NOME}` : `${NOME} — Encontre um professor e agende sua aula`;
  }, [titulo]);
}
