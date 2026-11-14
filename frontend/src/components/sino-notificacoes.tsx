import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useContagemNaoLidas } from '../hooks/use-notificacoes';

/** Acima disso, o selo mostra "9+" para não estourar o círculo. */
const MAXIMO_NO_SELO = 9;

/** RF13: atalho para as notificações, com a quantidade de avisos não lidos. */
export function SinoNotificacoes({ aoNavegar }: { aoNavegar?: () => void }) {
  const { data: naoLidas = 0 } = useContagemNaoLidas(true);
  const rotulo =
    naoLidas === 0 ? 'Notificações' : `Notificações, ${naoLidas} ${naoLidas === 1 ? 'não lida' : 'não lidas'}`;

  return (
    <Link
      to="/notificacoes"
      onClick={aoNavegar}
      aria-label={rotulo}
      title="Notificações"
      className="foco relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-primary hover:bg-white hover:text-secondary"
    >
      <Bell size={20} aria-hidden="true" />
      {naoLidas > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold leading-none text-white"
        >
          {naoLidas > MAXIMO_NO_SELO ? `${MAXIMO_NO_SELO}+` : naoLidas}
        </span>
      )}
    </Link>
  );
}
