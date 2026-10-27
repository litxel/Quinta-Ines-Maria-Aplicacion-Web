import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// ── Layout ──────────────────────────────────────────────────────────────────
import Navbar      from './components/layout/Navbar';
import Footer      from './components/layout/Footer';
import WelcomeModal from './components/shared/WelcomeModal';
import FloatingActionButtons from './components/shared/FloatingActionButtons';
import TelefonoRequeridoGate from './components/shared/TelefonoRequeridoGate';
import PageTransition from './components/shared/PageTransition';
import ScrollToTop from './components/shared/ScrollToTop';
import DialogoGlobal from './components/shared/DialogoGlobal';

// ── Guards ──────────────────────────────────────────────────────────────────
import ProtectedRoute from './components/shared/ProtectedRoute';

// ── Página de inicio: se carga de inmediato ──────────────────────────────────
import Home         from './pages/Home';

// ── El resto se descarga solo cuando se visita (code splitting): así el
//    celular no baja el panel admin, los gráficos ni el generador de PDF
//    al abrir la página de inicio.
const Paquetes     = lazy(() => import('./pages/Paquetes'));
const Galeria      = lazy(() => import('./pages/Galeria'));
const Configurador = lazy(() => import('./pages/Configurador'));
const Resenias     = lazy(() => import('./pages/Resenias'));

// ── Auth ─────────────────────────────────────────────────────────────────────
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const RecuperarClave  = lazy(() => import('./pages/RecuperarClave'));
const NuevaClave      = lazy(() => import('./pages/NuevaClave'));
const VerificarCuenta = lazy(() => import('./pages/VerificarCuenta'));
const AuthCallback    = lazy(() => import('./pages/AuthCallback'));

// ── Cliente ───────────────────────────────────────────────────────────────────
const Solicitar      = lazy(() => import('./pages/Solicitar'));
const MisSolicitudes = lazy(() => import('./pages/cliente/MisSolicitudes'));
const MiPerfil       = lazy(() => import('./pages/cliente/MiPerfil'));

// ── Admin ─────────────────────────────────────────────────────────────────────
const AdminLayout           = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard             = lazy(() => import('./pages/admin/Dashboard'));
const GestionSolicitudes    = lazy(() => import('./pages/admin/GestionSolicitudes'));
const SolicitudesArchivadas = lazy(() => import('./pages/admin/SolicitudesArchivadas'));
const GestionCatalogo       = lazy(() => import('./pages/admin/GestionCatalogo'));
const GestionGaleria        = lazy(() => import('./pages/admin/GestionGaleria'));
const GestionCalendario     = lazy(() => import('./pages/admin/GestionCalendario'));
const GestionUsuarios       = lazy(() => import('./pages/admin/GestionUsuarios'));
const Reportes              = lazy(() => import('./pages/admin/Reportes'));
const PerfilAdmin           = lazy(() => import('./pages/admin/PerfilAdmin'));

// Indicador mientras se descarga una página
function CargandoPagina() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Cargando">
      <div className="w-10 h-10 border-4 border-[#0D2137]/20 border-t-[#B7950B] rounded-full animate-spin" />
    </div>
  );
}

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
// Sin AnimatePresence mode="wait": la nueva ruta se monta de inmediato (evita el
// bug de "2-3 clics" donde el exit bloqueaba el montaje). La animación de entrada
// se reproduce al remontar PageTransition gracias al key=pathname.
function AnimatedOutlet() {
  const location = useLocation();
  return (
    <PageTransition key={location.pathname}>
      <Suspense fallback={<CargandoPagina />}>
        <Outlet />
      </Suspense>
    </PageTransition>
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
      <ScrollToTop />
      <DialogoGlobal />
      <Suspense fallback={<CargandoPagina />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
