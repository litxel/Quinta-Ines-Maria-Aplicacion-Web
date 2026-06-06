import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/useAuthStore';

// ── Layout ──────────────────────────────────────────────────────────────────
import Navbar      from './components/layout/Navbar';
import Footer      from './components/layout/Footer';
import AdminLayout from './components/admin/AdminLayout';
import WelcomeModal from './components/shared/WelcomeModal';
import FloatingActionButtons from './components/shared/FloatingActionButtons';
import TelefonoRequeridoGate from './components/shared/TelefonoRequeridoGate';
import PageTransition from './components/shared/PageTransition';

// ── Guards ──────────────────────────────────────────────────────────────────
import ProtectedRoute from './components/shared/ProtectedRoute';

// ── Páginas públicas ─────────────────────────────────────────────────────────
import Home         from './pages/Home';
import Paquetes     from './pages/Paquetes';
import Galeria      from './pages/Galeria';
import Configurador from './pages/Configurador';
import Resenias     from './pages/Resenias';

// ── Auth ─────────────────────────────────────────────────────────────────────
import Login           from './pages/Login';
import Register        from './pages/Register';
import RecuperarClave  from './pages/RecuperarClave';
import NuevaClave      from './pages/NuevaClave';
import VerificarCuenta from './pages/VerificarCuenta';
import AuthCallback    from './pages/AuthCallback';

// ── Cliente ───────────────────────────────────────────────────────────────────
import Solicitar      from './pages/Solicitar';
import MisSolicitudes from './pages/cliente/MisSolicitudes';

// ── Admin ─────────────────────────────────────────────────────────────────────
import Dashboard            from './pages/admin/Dashboard';
import GestionSolicitudes   from './pages/admin/GestionSolicitudes';
import SolicitudesArchivadas from './pages/admin/SolicitudesArchivadas';
import GestionCatalogo      from './pages/admin/GestionCatalogo';
import GestionGaleria       from './pages/admin/GestionGaleria';
import GestionCalendario    from './pages/admin/GestionCalendario';
import MiPerfil             from './pages/cliente/MiPerfil';
import GestionUsuarios      from './pages/admin/GestionUsuarios';
import Reportes             from './pages/admin/Reportes';
import PerfilAdmin          from './pages/admin/PerfilAdmin';

// =============================================================================
//  GUARDAS DE RUTA
// =============================================================================

function AuthRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return children;
  const rol     = user?.rol_codigo ?? user?.rol ?? '';
  const esAdmin = rol === 'ADMIN' || rol === 'administrador';
  return <Navigate to={esAdmin ? '/admin' : '/paquetes'} replace />;
}

// ── Layout público con transición de página ───────────────────────────────────
function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <Outlet />
      </PageTransition>
    </AnimatePresence>
  );
}

function PublicLayout() {
  return (
    <TelefonoRequeridoGate>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <WelcomeModal />
        <main className="flex-1">
          <AnimatedOutlet />
        </main>
        <Footer />
        <FloatingActionButtons />
      </div>
    </TelefonoRequeridoGate>
  );
}

// =============================================================================
//  APP — ÁRBOL DE RUTAS
// =============================================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Rutas públicas y de cliente ── */}
        <Route element={<PublicLayout />}>
          <Route path="/"           element={<Home />} />
          <Route path="/paquetes"   element={<Paquetes />} />
          <Route path="/galeria"    element={<Galeria />} />
          <Route path="/configurador" element={<Configurador />} />
          <Route path="/resenias"   element={<Resenias />} />

          <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          <Route path="/recuperar-clave"  element={<RecuperarClave />} />
          <Route path="/nueva-clave"      element={<NuevaClave />} />
          <Route path="/verificar-cuenta" element={<VerificarCuenta />} />
          <Route path="/auth/callback"    element={<AuthCallback />} />

          <Route path="/solicitar" element={<Solicitar />} />

          <Route
            path="/mis-solicitudes"
            element={<ProtectedRoute rol="CLIENTE"><MisSolicitudes /></ProtectedRoute>}
          />
          <Route
            path="/mi-perfil"
            element={<ProtectedRoute rol="CLIENTE"><MiPerfil /></ProtectedRoute>}
          />

          <Route path="*" element={
            <div className="flex-1 flex items-center justify-center py-24 min-h-[60vh]">
              <div className="text-center">
                <p className="text-7xl mb-6">🏡</p>
                <h1 className="font-display text-4xl font-bold text-[#0D2137] dark:text-white mb-3">
                  Página no encontrada
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">La página que buscas no existe o fue movida.</p>
                <a href="/" className="btn-primary inline-flex">Volver al inicio</a>
              </div>
            </div>
          } />
        </Route>

        {/* ── Panel Admin ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute rol="ADMIN">
              <TelefonoRequeridoGate>
                <AdminLayout />
              </TelefonoRequeridoGate>
            </ProtectedRoute>
          }
        >
          <Route index                 element={<Dashboard />} />
          <Route path="solicitudes"    element={<GestionSolicitudes />} />
          <Route path="archivadas"     element={<SolicitudesArchivadas />} />
          <Route path="catalogo"       element={<GestionCatalogo />} />
          <Route path="galeria"        element={<GestionGaleria />} />
          <Route path="calendario"     element={<GestionCalendario />} />
          <Route path="usuarios"       element={<GestionUsuarios />} />
          <Route path="reportes"       element={<Reportes />} />
          <Route path="perfil"         element={<PerfilAdmin />} />
          <Route path="*"              element={<Navigate to="/admin" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
