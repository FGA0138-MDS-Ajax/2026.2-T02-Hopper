interface LogoProps {
  /** Variante clara para usar sobre o painel azul. */
  clara?: boolean;
  className?: string;
}

/** Marca do AulaCerta (livro + relógio + check) em SVG, com o nome ao lado. */
export function Logo({ clara = false, className = '' }: LogoProps) {
  const corLivro = clara ? '#ffffff' : '#1b3a64';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 64 44"
        className="h-8 w-auto shrink-0"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 9v29c9-1.5 17 .5 23 5V13C22 8.5 13.5 7 5 9Z" stroke={corLivro} strokeWidth="3.4" />
        <path
          d="M10 16c4.5 0 8.5 1 12.5 3M10 22c4.5 0 8.5 1 12.5 3M10 28c4.5 0 8.5 1 12.5 3"
          stroke={corLivro}
          strokeWidth="2.6"
        />
        <circle cx="42" cy="20" r="12.5" stroke="#1fc58e" strokeWidth="3.4" />
        <path d="M42 13.5v7.5h5.5M39 4h6" stroke="#1fc58e" strokeWidth="3.2" />
        <path d="M34 29l7 7 19-21" stroke="#24a8d8" strokeWidth="5.2" />
      </svg>
      <span className={`text-xl font-extrabold tracking-tight ${clara ? 'text-white' : 'text-primary'}`}>
        Aula<span className={clara ? 'text-ceu' : 'text-secondary'}>Certa</span>
      </span>
    </span>
  );
}
