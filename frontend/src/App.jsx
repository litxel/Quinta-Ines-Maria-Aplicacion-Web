import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// ── Layout ──────────────────────────────────────────────────────────────────
import Navbar      from './components/layout/Navbar';
import Footer      from './components/layout/Footer';
import AdminLayout from './components/admin/AdminLayout';
import WelcomeModal from './components/shared/WelcomeModal';
import FloatingActionButtons from './components/shared/FloatingActionButtons';
import TelefonoRequeridoGate from './components/shared/TelefonoRequeridoGate';

// ── Guards ──────────────────────────────────────────────────────────────────
import ProtectedRoute from './components/shared/ProtectedRoute';

// ── Páginas públicas ─────────────────────────────────────────────────────────
import Home         from './pages/Home';
import Paquetes     from './pages/Paquetes';
import Galeria      from './pages/Galeria';
import Configurador from './pages/Configurador';
import Resenias     from './pages/Resenias';

// ── Auth ───────────────────────────────────────────────────────────────────────────
import Login           from './pages/Login';
import Register        from './pages/Register';
import RecuperarClave  from './pages/RecuperarClave';
import NuevaClave      from './pages/NuevaClave';
import VerificarCuenta from './pages/VerificarCuenta';
import AuthCallback    from './pages/AuthCallback';

// ── Cliente ───────────────────────────────────────────────────────────────────
import Solicitar       from './pages/Solicitar';
import MisSolicitudes  from './pages/cliente/MisSolicitudes';

// ── Admin ─────────────────────────────────────────────────────────────────────
import Dashboard         from './pages/admin/Dashboard';
import GestionSolicitudes from './pages/admin/GestionSolicitudes';
import SolicitudesArchivadas from './pages/admin/SolicitudesArchivadas';
import GestionCatalogo    from './pages/admin/GestionCatalogo';
import GestionGaleria from './pages/admin/GestionGaleria';
import GestionCalendario from './pages/admin/GestionCalendario';
import MiPerfil          from './pages/cliente/MiPerfil';
import GestionUsuarios   from './pages/admin/GestionUsuarios';
import Reportes          from './pages/admin/Reportes';
import PerfilAdmin        from './pages/admin/PerfilAdmin';
// =============================================================================
//  GUARDAS DE RUTA
// =============================================================================

/**
 * AuthRoute — solo para usuarios NO autenticados.
 * Si ya estás logueado, redirige según tu rol.
 */
function AuthRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return children;
  
  // Redirigir según rol (acepta 'ADMIN' o 'administrador' según tu lógica anterior)
  const rol = user?.rol_codigo ?? user?.rol ?? '';
  const esAdmin = rol === 'ADMIN' || rol === 'administrador';
  
  return <Navigate to={esAdmin ? '/admin' : '/paquetes'} replace />;
}

// ── Layout Wrapper para rutas públicas (Incluye Navbar y Footer) ──────────────
function PublicLayout() {
  return (
    <TelefonoRequeridoGate>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <WelcomeModal />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <FloatingActionButtons />
      </div>
    </TelefonoRequeridoGate>
  );
}

// =============================================================================
//  APP — ÁRBOL DE RUTAS COMPLETO
// =============================================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ══════════════════════════════════════════════════════════════════
            RUTAS PÚBLICAS Y DE CLIENTE (Usan Navbar y Footer)
            ══════════════════════════════════════════════════════════════════ */}
        <Route element={<PublicLayout />}>
          {/* Públicas */}
          <Route path="/"           element={<Home />} />
          <Route path="/paquetes"   element={<Paquetes />} />
          <Route path="/galeria"    element={<Galeria />} />
          <Route path="/configurador" element={<Configurador />} />
          <Route path="/resenias"   element={<Resenias />} />

          {/* Auth — solo para no autenticados */}
          <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          <Route path="/recuperar-clave"   element={<RecuperarClave />} />
          <Route path="/nueva-clave"       element={<NuevaClave />} />
          <Route path="/verificar-cuenta"  element={<VerificarCuenta />} />
          <Route path="/auth/callback"     element={<AuthCallback />} />

          {/* Solicitar — maneja su propio modal de login para conservar el store */}
          <Route path="/solicitar" element={<Solicitar />} />

          {/* Mis solicitudes — solo cliente (o admin que también es cliente) */}
          <Route
            path="/mis-solicitudes"
            element={
              <ProtectedRoute rol="CLIENTE">
                <MisSolicitudes />
              </ProtectedRoute>
            }
          />

          {/* Mi Perfil — solo cliente */}
          <Route
            path="/mi-perfil"
            element={
              <ProtectedRoute rol="CLIENTE">
                <MiPerfil />
              </ProtectedRoute>
            }
          />

          {/* 404 (Dentro del layout público para que se vea bien) */}
          <Route path="*" element={
            <div className="flex-1 bg-[#F5F0E8] flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-6xl mb-4">🏡</p>
                <h1 className="font-display text-3xl font-bold text-[#0D2137] mb-2">Página no encontrada</h1>
                <a href="/" className="text-[#1A6BAC] underline font-medium">Volver al inicio</a>
              </div>
            </div>
          } />
        </Route>

        {/* ══════════════════════════════════════════════════════════════════
            PANEL ADMIN — Usa AdminLayout (sidebar + header). NO usa Footer.
            Todas las rutas bajo /admin requieren rol ADMIN.
            ══════════════════════════════════════════════════════════════════ */}
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
          {/* index → /admin muestra el Dashboard */}
          <Route index element={<Dashboard />} />

          {/* /admin/solicitudes → tabla de gestión */}
          <Route path="solicitudes" element={<GestionSolicitudes />} />

          {/* Cualquier ruta /admin/* no definida redirige al dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />

          {/* /admin/catalogo → gestión de paquetes */}
          <Route path="catalogo" element={<GestionCatalogo />} /> 
          {/* /admin/catalogo → gestión de paquetes */}
        
          <Route path="galeria" element={<GestionGaleria />} />
          {/* /admin/solicitudes → tabla de gestión */}
          <Route path="solicitudes" element={<GestionSolicitudes />} />

          {/* 🚀 NUEVA RUTA: /admin/calendario → Gestión de disponibilidad */}
          <Route path="calendario" element={<GestionCalendario />} />

          {/* Sprint 6: Gestión de usuarios y reportes */}
          <Route path="usuarios"   element={<GestionUsuarios />} />
          <Route path="reportes"   element={<Reportes />} />
          <Route path="perfil"     element={<PerfilAdmin />} />
          <Route path="archivadas" element={<SolicitudesArchivadas />} />
          
        </Route>

      </Routes>
    </BrowserRouter>
  );
}