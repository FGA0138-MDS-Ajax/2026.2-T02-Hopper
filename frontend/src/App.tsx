import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="pagina-centralizada">
              <div className="cartao">
                <img
                  src="/logo.png"
                  alt="Logo AulaCerta"
                  className="w-20 h-20 object-contain drop-shadow-sm"
                />

                <h1 className="text-3xl font-bold text-primary">
                  Aula<span className="text-secondary">Certa</span>
                </h1>

                <p className="text-sm text-slate-600">
                  Ambiente Front-End configurado com sucesso! React + Vite + TypeScript + Tailwind CSS.
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
