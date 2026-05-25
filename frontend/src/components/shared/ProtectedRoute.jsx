import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// =============================================================================
//  COMPONENTE — ProtectedRoute
//
//  Uso:
//    <ProtectedRoute>                     → cualquier usuario autenticado
//    <ProtectedRoute rol="ADMIN">         → solo administradores
//    <ProtectedRoute rol="CLIENTE">       → clientes (y admins también pasan)
//
//  Flujo de redirección:
//    No autenticado   → /login  (guarda la ruta en redirectAfterLogin)
//    Autenticado sin  → /       (acceso denegado, redirige al home)
//    rol correcto
// =============================================================================
export default function ProtectedRoute({ children, rol = null }) {
  const location                             = useLocation();
  const { isAuthenticated, user, setRedirectAfterLogin } = useAuthStore();

  // ── No autenticado → login ────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    setRedirectAfterLogin(location.pathname + location.search);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ── Verificar rol específico ──────────────────────────────────────────────
  if (rol) {
    const rolUsuario = user.rol_codigo ?? user.rol ?? '';

    // ADMIN siempre tiene acceso a rutas de CLIENTE
    const tieneAcceso =
      rolUsuario === 'ADMIN' ||
      rolUsuario === rol;

    if (!tieneAcceso) {
      // Redirigir según el rol real del usuario
      const destino = rolUsuario === 'CLIENTE' ? '/mis-solicitudes' : '/';
      return <Navigate to={destino} replace />;
    }
  }

  return children;
}
