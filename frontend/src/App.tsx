import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RotaProtegida } from './components/rota-protegida';
import { SessaoProvider } from './contexts/sessao';
import { PaginaInicio } from './pages/inicio';

// A página inicial vai no pacote principal; as demais são baixadas só quando a rota é aberta.
const PaginaCadastro = lazy(() => import('./pages/cadastro').then((m) => ({ default: m.PaginaCadastro })));
const PaginaEntrar = lazy(() => import('./pages/entrar').then((m) => ({ default: m.PaginaEntrar })));
const PaginaMeuPerfil = lazy(() => import('./pages/meu-perfil').then((m) => ({ default: m.PaginaMeuPerfil })));
const PaginaMinhasAulas = lazy(() => import('./pages/minhas-aulas').then((m) => ({ default: m.PaginaMinhasAulas })));
const PaginaNaoEncontrada = lazy(() =>
  import('./pages/nao-encontrada').then((m) => ({ default: m.PaginaNaoEncontrada })),
);
const PaginaNotificacoes = lazy(() => import('./pages/notificacoes').then((m) => ({ default: m.PaginaNotificacoes })));
const PaginaPrivacidade = lazy(() => import('./pages/privacidade').then((m) => ({ default: m.PaginaPrivacidade })));
const PaginaProfessor = lazy(() => import('./pages/professor').then((m) => ({ default: m.PaginaProfessor })));
const PaginaProfessores = lazy(() => import('./pages/professores').then((m) => ({ default: m.PaginaProfessores })));
const PaginaRecuperarSenha = lazy(() =>
  import('./pages/recuperar-senha').then((m) => ({ default: m.PaginaRecuperarSenha })),
);
const PaginaRedefinirSenha = lazy(() =>
  import('./pages/redefinir-senha').then((m) => ({ default: m.PaginaRedefinirSenha })),
);
const PaginaSolicitarAula = lazy(() =>
  import('./pages/solicitar-aula').then((m) => ({ default: m.PaginaSolicitarAula })),
);

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

/** Aparece por um instante enquanto o código da tela é baixado. */
function Carregando() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-secondary"
      />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function App() {
  return (
    <SessaoProvider>
      <BrowserRouter>
        <RolarParaOTopo />
        <Suspense fallback={<Carregando />}>
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
              path="/notificacoes"
              element={
                <RotaProtegida>
                  <PaginaNotificacoes />
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
            <Route path="*" element={<PaginaNaoEncontrada />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SessaoProvider>
  );
}

export default App;
