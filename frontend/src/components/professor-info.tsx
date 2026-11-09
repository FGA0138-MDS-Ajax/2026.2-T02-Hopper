import { House, MapPin, Monitor } from 'lucide-react';
import { ROTULO_MODALIDADE, type Modalidade } from '../services/professores';

export const ICONE_MODALIDADE: Record<Modalidade, typeof Monitor> = {
  ONLINE: Monitor,
  PRESENCIAL: MapPin,
  DOMICILIO: House,
};

const CORES_AVATAR = [
  'bg-blue-50 text-secondary',
  'bg-emerald-50 text-emerald-800',
  'bg-sky-50 text-sky-800',
  'bg-slate-100 text-primary',
];

export const formatarReais = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

function corDoAvatar(id: string): string {
  let soma = 0;
  for (const caractere of id) soma += caractere.charCodeAt(0);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

const TAMANHOS_AVATAR = {
  medio: 'h-12 w-12 text-base',
  grande: 'h-16 w-16 text-xl',
};

/** Círculo com as iniciais do professor, numa cor estável derivada do id. */
export function AvatarProfessor({
  id,
  nome,
  tamanho = 'medio',
}: {
  id: string;
  nome: string;
  tamanho?: keyof typeof TAMANHOS_AVATAR;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${TAMANHOS_AVATAR[tamanho]} ${corDoAvatar(id)}`}
    >
      {iniciais(nome)}
    </div>
  );
}

/** Lista das modalidades com ícone (o ícone ajuda a distinguir online, presencial e domicílio). */
export function ListaModalidades({ modalidades }: { modalidades: Modalidade[] }) {
  return (
    <ul aria-label="Modalidades" className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-suave">
      {modalidades.map((modalidade) => {
        const Icone = ICONE_MODALIDADE[modalidade];
        return (
          <li key={modalidade} className="inline-flex items-center gap-1">
            <Icone size={14} aria-hidden="true" />
            {ROTULO_MODALIDADE[modalidade]}
          </li>
        );
      })}
    </ul>
  );
}
