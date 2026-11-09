import type { Config } from 'tailwindcss';

// Tokens descritos em DESIGN.md
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00236f', // Marinho: títulos e painéis escuros
        secondary: '#0051d5', // Azul de ação: botões e destaques
        ceu: '#24a8d8', // Azul-claro da logo
        menta: '#1fc58e', // Verde da logo: sucesso / confirmada
        ambar: '#f59e0b', // Pendente / solicitada
        error: '#ba1a1a', // Erros / recusada / cancelada
        surface: '#f6f8fd', // Fundo da página
        tinta: '#0f172a', // Texto principal
        suave: '#475569', // Texto secundário
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
