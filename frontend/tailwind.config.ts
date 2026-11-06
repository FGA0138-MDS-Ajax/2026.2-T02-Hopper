import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cores da identidade visual do AulaCerta (Stitch)
        primary: '#00236f',      // Azul marinho principal
        secondary: '#0051d5',    // Azul de destaque / ação
        surface: '#faf8ff',      // Fundo suave da aplicação
        error: '#ba1a1a',        // Vermelho de erro e alertas
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
