import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

/**
 * Página de callback OAuth.
 * El backend redirige aquí con #token=JWT (en el fragmento, para que el token
 * nunca viaje a ningún servidor ni quede en el historial de logs).
 * Esta página pide el perfil completo, guarda la sesión y redirige al destino.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { login, clearRedirect } = useAuthStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token  = params.get('token');

    // Quitar el token de la barra de direcciones de inmediato
    window.history.replaceState(null, '', window.location.pathname);

    if (!token) {
      setError('No se recibió la sesión. Redirigiendo al inicio de sesión...');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
      return;
    }

    // Ruta pendiente guardada antes de ir a OAuth (p. ej. el invitado que
    // estaba finalizando su evento en /solicitar). Sobrevive a la recarga
    // porque el store de auth se persiste en localStorage.
    const destinoPendiente = useAuthStore.getState().redirectAfterLogin;

    // El token se envía solo en esta petición (no se fija como cabecera global,
    // así no queda "pegado" en axios después de cerrar sesión).
    api.get('/usuarios/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        const usuario = data.usuario;
        login(usuario, token);
        if (usuario.rol_codigo === 'ADMIN') {
          clearRedirect();
          navigate('/admin', { replace: true });
          return;
        }
        // Cliente: si hay un destino pendiente (configurador/solicitud), lo
        // enviamos ahí para que finalice y se guarde su evento.
        const destino = destinoPendiente ?? '/paquetes';
        clearRedirect();
        navigate(destino, { replace: true });
      })
      .catch(() => {
        setError('No pudimos completar el inicio de sesión. Intenta de nuevo.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#EEE3CF] dark:bg-[#221634] flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-sm">
            <p className="text-2xl mb-3">⚠️</p>
            <p className="text-red-700 font-medium text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-[#0D2137] border-t-[#B7950B] rounded-full animate-spin mx-auto" />
            <p className="text-[#0D2137] dark:text-white font-semibold text-sm">Verificando tu sesión...</p>
            <p className="text-slate-400 text-xs">Redirigiendo, por favor espera.</p>
          </div>
        )}
      </div>
    </main>
  );
}
