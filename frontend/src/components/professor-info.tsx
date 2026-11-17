import { ROTULO_MODALIDADE, type Modalidade } from '../services/professores';
import { iniciais } from '../utils/formatacao';
import { ICONE_MODALIDADE } from '../utils/modalidades';

const CORES_AVATAR = [
  'bg-blue-50 text-secondary',
  'bg-emerald-50 text-emerald-800',
  'bg-sky-50 text-sky-800',
  'bg-slate-100 text-primary',
];

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
