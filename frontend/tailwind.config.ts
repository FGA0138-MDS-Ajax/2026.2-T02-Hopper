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
      boxShadow: {
        cartao: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 40px -12px rgba(0, 35, 111, 0.14)',
        destaque: '0 24px 60px -20px rgba(0, 81, 213, 0.55)',
      },
    },
  },
  plugins: [],
};

export default config;
