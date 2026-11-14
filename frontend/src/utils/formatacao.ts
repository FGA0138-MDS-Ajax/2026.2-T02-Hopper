/** Valor em reais, sem centavos: "R$ 90". */
export const formatarReais = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

/** Iniciais do primeiro e do último nome: "Ana Souza" vira "AS". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** "(61) 99111-0001" a partir de "61991110001". */
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  if (numeros.length === 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return telefone;
}
