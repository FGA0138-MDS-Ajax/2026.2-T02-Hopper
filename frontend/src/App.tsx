import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RotaProtegida } from './components/rota-protegida';
import { SessaoProvider } from './contexts/sessao';
import { PaginaCadastro } from './pages/cadastro';
import { PaginaEmConstrucao } from './pages/em-construcao';
import { PaginaEntrar } from './pages/entrar';
import { PaginaInicio } from './pages/inicio';
import { PaginaMeuPerfil } from './pages/meu-perfil';
import { PaginaMinhasAulas } from './pages/minhas-aulas';
import { PaginaPrivacidade } from './pages/privacidade';
import { PaginaProfessor } from './pages/professor';
import { PaginaProfessores } from './pages/professores';
import { PaginaRecuperarSenha } from './pages/recuperar-senha';
import { PaginaRedefinirSenha } from './pages/redefinir-senha';
import { PaginaSolicitarAula } from './pages/solicitar-aula';

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
    <SessaoProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RolarParaOTopo />
        <Routes>
          <Route path="/" element={<PaginaInicio />} />
          <Route path="/professores" element={<PaginaProfessores />} />
          <Route path="/professores/:id" element={<PaginaProfessor />} />
          <Route path="/entrar" element={<PaginaEntrar />} />
          <Route path="/cadastro" element={<PaginaCadastro />} />
          <Route path="/recuperar-senha" element={<PaginaRecuperarSenha />} />
          <Route path="/redefinir-senha" element={<PaginaRedefinirSenha />} />
          <Route path="/privacidade" element={<PaginaPrivacidade />} />
          <Route
            path="/meu-perfil"
            element={
              <RotaProtegida>
                <PaginaMeuPerfil />
              </RotaProtegida>
            }
          />
          <Route
            path="/minhas-aulas"
            element={
              <RotaProtegida>
                <PaginaMinhasAulas />
              </RotaProtegida>
            }
          />
          <Route
            path="/professores/:id/solicitar"
            element={
              <RotaProtegida>
                <PaginaSolicitarAula />
              </RotaProtegida>
            }
          />
          <Route path="*" element={<PaginaEmConstrucao />} />
        </Routes>
      </BrowserRouter>
    </SessaoProvider>
  );
}

export default App;
