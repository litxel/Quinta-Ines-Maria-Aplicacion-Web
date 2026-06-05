import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { actualizarMiPerfil } from '../../services/usuarios.service';

const PHONE_RE = /^[0-9]{9,10}$/;

/**
 * Modal bloqueante: usuario OAuth sin teléfono en BD.
 */
export default function CompletarTelefonoModal() {
  const { user, updateUser } = useAuthStore();
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!PHONE_RE.test(telefono)) {
      setError('Ingresa un número válido de 9 a 10 dígitos (celular Ecuador).');
      return;
    }
    setGuardando(true);
    try {
      const { usuario } = await actualizarMiPerfil({
        nombre_completo: user?.nombre_completo || user?.nombre || 'Usuario',
        telefono,
      });
      updateUser({ telefono: usuario.telefono, nombre_completo: usuario.nombre_completo });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el teléfono.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0D2137]/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tel-modal-title"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#B7950B]/15 flex items-center justify-center mx-auto mb-5">
          <Phone size={28} className="text-[#B7950B]" />
        </div>
        <h2 id="tel-modal-title" className="font-display text-2xl font-bold text-[#0D2137] text-center">
          Completa tu perfil
        </h2>
        <p className="text-slate-600 text-sm text-center mt-2 leading-relaxed">
          Para continuar necesitamos tu <strong>número de celular</strong>. Lo usaremos para coordinar tu evento y contactarte por WhatsApp.
        </p>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="tel-oauth" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Número de celular
            </label>
            <input
              id="tel-oauth"
              type="tel"
              inputMode="numeric"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0991234567"
              className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-[#B7950B] focus:outline-none focus:ring-2 focus:ring-[#B7950B]/20 text-slate-900 font-medium"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="w-full py-3.5 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] transition-colors disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Continuar al sistema'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
