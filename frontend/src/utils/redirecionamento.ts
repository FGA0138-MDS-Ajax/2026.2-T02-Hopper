/**
 * Destino depois de entrar ou criar conta. Só aceita caminhos internos ("/professores/..."):
 * evita que um link malicioso (?voltar=https://site-falso) mande o usuário para fora do AulaCerta.
 */
export function destinoSeguro(voltar: string | null | undefined, padrao = '/'): string {
  if (!voltar || !voltar.startsWith('/') || voltar.startsWith('//') || voltar.startsWith('/\\')) return padrao;
  return voltar;
}

/** Monta "/entrar?voltar=..." (ou /cadastro) preservando o destino. */
export function comVoltar(caminho: string, voltar: string | null | undefined): string {
  const destino = destinoSeguro(voltar, '');
  return destino ? `${caminho}?voltar=${encodeURIComponent(destino)}` : caminho;
}
