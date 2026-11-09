import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PaginaEmConstrucao } from './pages/em-construcao';
import { PaginaInicio } from './pages/inicio';
import { PaginaPrivacidade } from './pages/privacidade';

/** Ao trocar de página, volta ao topo (links com #âncora continuam rolando até a seção). */
function RolarParaOTopo() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RolarParaOTopo />
      <Routes>
        <Route path="/" element={<PaginaInicio />} />
        <Route path="/privacidade" element={<PaginaPrivacidade />} />
        {/* Próximas etapas: /professores, /professores/:id, /entrar, /cadastro */}
        <Route path="*" element={<PaginaEmConstrucao />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
