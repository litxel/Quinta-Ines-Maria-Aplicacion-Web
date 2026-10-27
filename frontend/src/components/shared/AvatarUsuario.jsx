import { useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { urlImagen } from '../../utils/urls';
import { esRolAdmin } from '../../utils/roles';

// caja: tamaño total · borde: grosor del anillo · foto: ancho pedido a Cloudinary
const TAMANOS = {
  sm: { caja: 34, borde: 2,   texto: 'text-xs',  foto: 96,  insignia: 'w-4 h-4',   icono: 9  },
  md: { caja: 44, borde: 2.5, texto: 'text-sm',  foto: 120, insignia: 'w-5 h-5',   icono: 11 },
  lg: { caja: 64, borde: 3,   texto: 'text-xl',  foto: 192, insignia: 'w-6 h-6',   icono: 13 },
};

/**
 * Foto de perfil con un anillo de luz que gira alrededor y un halo suave que
 * "respira" detrás (estilos .avatar-* en index.css).
 * El color indica el rol: dorado = administrador, violeta/azul = cliente.
 * Si no hay foto (o no carga) muestra la inicial del nombre.
 */
export default function AvatarUsuario({ user, tamano = 'sm', insignia = false, className = '' }) {
  const [fotoRota, setFotoRota] = useState(false);
  const t       = TAMANOS[tamano] ?? TAMANOS.sm;
  const esAdmin = esRolAdmin(user);
  const foto    = urlImagen(user?.foto_perfil, t.foto);
  const inicial = (user?.nombre_completo ?? user?.nombre ?? 'U').trim().charAt(0).toUpperCase() || 'U';

  return (
    <span
      className={`relative inline-flex shrink-0 ${esAdmin ? 'avatar-admin' : 'avatar-cliente'} ${className}`}
      style={{ width: t.caja, height: t.caja }}
    >
      {/* Halo suave detrás */}
      <span aria-hidden className="avatar-halo absolute -inset-1.5 rounded-full blur-md" style={{ background: 'var(--avatar-grad)' }} />
      {/* Anillo de luz que gira */}
      <span aria-hidden className="avatar-anillo absolute inset-0 rounded-full" style={{ background: 'var(--avatar-grad)' }} />

      {/* Foto (con un filo claro/oscuro que la separa del anillo) */}
      <span
        className={`absolute rounded-full overflow-hidden flex items-center justify-center font-bold text-white ring-2 ring-white dark:ring-[#2E2046] ${t.texto}`}
        style={{ inset: t.borde, background: 'var(--avatar-fondo)' }}
      >
        {foto && !fotoRota ? (
          <img src={foto} alt="" onError={() => setFotoRota(true)} className="w-full h-full object-cover" />
        ) : (
          <span aria-hidden>{inicial}</span>
        )}
      </span>

      {/* Insignia del rol */}
      {insignia && (
        <span
          title={esAdmin ? 'Administrador' : 'Cliente'}
          className={`absolute -bottom-0.5 -right-0.5 z-10 ${t.insignia} rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#332247] ${
            esAdmin ? 'bg-gradient-to-br from-[#F0D060] to-[#B7950B] text-[#3D2E00]' : 'bg-gradient-to-br from-[#A971D6] to-[#1A6BAC] text-white'
          }`}
        >
          {esAdmin ? <Crown size={t.icono} strokeWidth={2.5} /> : <Sparkles size={t.icono} strokeWidth={2.5} />}
        </span>
      )}
    </span>
  );
}
