import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar      from './components/layout/Navbar';
import Home        from './pages/Home';
import Paquetes    from './pages/Paquetes';
import Galeria     from './pages/Galeria';
import Configurador from './pages/Configurador';

// Páginas de auth (Sprint 3 — esqueletos simples)
function Login()    { return <main className="min-h-screen pt-24 flex items-center justify-center"><p className="text-slate-500">Login — Sprint 3 (pendiente)</p></main>; }
function Register() { return <main className="min-h-screen pt-24 flex items-center justify-center"><p className="text-slate-500">Registro — Sprint 3 (pendiente)</p></main>; }
function NotFound() { return <main className="min-h-screen pt-24 flex items-center justify-center text-center"><div><h1 className="font-display text-5xl text-[#0D2137] font-bold">404</h1><p className="text-slate-500 mt-2">Página no encontrada.</p><a href="/" className="mt-4 inline-block text-[#1A6BAC] underline">Volver al inicio</a></div></main>; }

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar fijo en todas las páginas */}
      <Navbar />

      {/* main se salta el navbar con padding-top (h-16) */}
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/paquetes"      element={<Paquetes />} />
        <Route path="/galeria"       element={<Galeria />} />
        <Route path="/configurador"  element={<Configurador />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="*"              element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
