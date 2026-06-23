import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

/**
 * Página de callback OAuth.
 * El backend redirige aquí con ?token=JWT&nombre=X&correo=Y&rol=Z
 * Esta página guarda el token en el store y redirige al destino.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, clearRedirect } = useAuthStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token  = searchParams.get('token');
    const nombre = searchParams.get('nombre');
    const correo = searchParams.get('correo');
    const rol    = searchParams.get('rol');
    const err    = searchParams.get('error');

    if (err) {
      setError('Error en la autenticación social. Por favor, intenta de nuevo.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setError('Token no recibido. Redirigiendo...');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Guardar token y datos del usuario en el store
    // Usar la misma estructura que el login normal
    const usuarioData = {
      nombre_completo: nombre ? decodeURIComponent(nombre) : 'Usuario',
      correo: correo ? decodeURIComponent(correo) : '',
      rol_codigo: rol || 'CLIENTE',
    };

    // Llamar al endpoint de perfil para obtener datos completos
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const requiereTel = searchParams.get('requiere_telefono') === '1';

    // Ruta pendiente guardada antes de ir a OAuth (p. ej. el invitado que
    // estaba finalizando su evento en /solicitar). Sobrevive a la recarga
    // porque el store de auth se persiste en localStorage.
    const destinoPendiente = useAuthStore.getState().redirectAfterLogin;

    api.get('/usuarios/me')
      .then(({ data }) => {
        const usuario = data.usuario ?? usuarioData;
        login(usuario, token);
        const esAdmin = (usuario.rol_codigo ?? rol) === 'ADMIN';
        if (esAdmin) {
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
        login(usuarioData, token);
        const destino = destinoPendiente ?? '/paquetes';
        clearRedirect();
        navigate(destino, { replace: true });
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#EEE3CF] flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-sm">
            <p className="text-2xl mb-3">⚠️</p>
            <p className="text-red-700 font-medium text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-[#0D2137] border-t-[#B7950B] rounded-full animate-spin mx-auto" />
            <p className="text-[#0D2137] font-semibold text-sm">Verificando tu sesión...</p>
            <p className="text-slate-400 text-xs">Redirigiendo, por favor espera.</p>
          </div>
        )}
      </div>
    </main>
  );
}
