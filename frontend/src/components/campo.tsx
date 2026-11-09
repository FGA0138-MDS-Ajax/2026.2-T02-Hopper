import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  /** Texto de ajuda abaixo do campo. */
  dica?: ReactNode;
  erro?: string;
  /** Ação ao lado do rótulo (ex.: "Esqueci minha senha"). */
  acaoDoRotulo?: ReactNode;
}

const classeEntrada =
  'h-12 w-full rounded-xl border bg-white px-4 text-base text-tinta placeholder:text-slate-400 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/30';

/** Campo de texto com rótulo, dica e mensagem de erro ligados por aria (RNF05). */
export const Campo = forwardRef<HTMLInputElement, CampoProps>(function Campo(
  { rotulo, dica, erro, acaoDoRotulo, id, type = 'text', className = '', onKeyUp, ...resto },
  ref,
) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idDica = `${idCampo}-dica`;
  const idErro = `${idCampo}-erro`;
  const idCapsLock = `${idCampo}-caps`;
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [capsLockAtivo, setCapsLockAtivo] = useState(false);
  const ehSenha = type === 'password';

  function aoSoltarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (ehSenha) setCapsLockAtivo(evento.getModifierState('CapsLock'));
    onKeyUp?.(evento);
  }

  const descritores =
    [dica && !erro ? idDica : null, erro ? idErro : null, capsLockAtivo ? idCapsLock : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={idCampo} className="block text-sm font-semibold text-tinta">
          {rotulo}
        </label>
        {acaoDoRotulo}
      </div>
      <div className="relative mt-1.5">
        <input
          ref={ref}
          id={idCampo}
          type={ehSenha && senhaVisivel ? 'text' : type}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritores}
          onKeyUp={aoSoltarTecla}
          className={`${classeEntrada} ${ehSenha ? 'pr-12' : ''} ${
            erro ? 'border-error focus-visible:border-error' : 'border-slate-300 focus-visible:border-secondary'
          }`}
          {...resto}
        />
        {ehSenha && (
          <button
            type="button"
            onClick={() => setSenhaVisivel((valor) => !valor)}
            className="foco absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-suave hover:text-primary"
            aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={senhaVisivel}
          >
            {senhaVisivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {capsLockAtivo && (
        <p id={idCapsLock} className="mt-1.5 text-sm font-medium text-amber-700">
          Caps Lock está ativado.
        </p>
      )}
      {dica && !erro && (
        <p id={idDica} className="mt-1.5 text-sm text-suave">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="mt-1.5 text-sm font-medium text-error">
          {erro}
        </p>
      )}
    </div>
  );
});
