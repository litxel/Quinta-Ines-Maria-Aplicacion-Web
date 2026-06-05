import { useAuthStore } from '../../store/useAuthStore';
import CompletarTelefonoModal from './CompletarTelefonoModal';

function necesitaTelefono(user) {
  if (!user) return false;
  const rol = user.rol_codigo ?? user.rol ?? '';
  if (rol === 'ADMIN') return false;
  const tel = user.telefono;
  return !tel || String(tel).trim() === '';
}

/** Bloquea la app hasta que el cliente OAuth registre su celular. */
export default function TelefonoRequeridoGate({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && necesitaTelefono(user)) {
    return (
      <>
        <div className="pointer-events-none opacity-40 blur-[2px] min-h-[50vh]" aria-hidden>
          {children}
        </div>
        <CompletarTelefonoModal />
      </>
    );
  }

  return children;
}
