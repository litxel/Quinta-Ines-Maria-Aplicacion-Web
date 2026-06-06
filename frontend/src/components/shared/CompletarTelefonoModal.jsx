import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { actualizarMiPerfil } from '../../services/usuarios.service';

const PHONE_RE = /^[0-9]{9,10}$/;

export default function CompletarTelefonoModal() {
  const { user, updateUser } = useAuthStore();
  const [telefono, setTelefono] = useState('');
  const [error,    setError]    = useState('');
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0D2137]/65 dark:bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 290, damping: 24 }}
        className="bg-white dark:bg-[#0C1829] rounded-3xl shadow-2xl dark:shadow-black/60 max-w-md w-full p-8 border border-slate-100 dark:border-white/8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tel-modal-title"
      >
        {/* Ícono */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A227]/15 to-[#B7950B]/20 flex items-center justify-center mx-auto mb-6 border border-[#C9A227]/20">
          <Phone size={30} className="text-[#C9A227]" />
        </div>

        <h2 id="tel-modal-title" className="font-display text-3xl font-bold text-[#0D2137] dark:text-white text-center leading-tight">
          Completa tu perfil
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-3 leading-relaxed">
          Para continuar necesitamos tu <strong className="text-[#0D2137] dark:text-white font-bold">número de celular</strong>. Lo usaremos para coordinar tu evento y contactarte por WhatsApp.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium"
          >
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="tel-oauth" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Número de celular
            </label>
            <input
              id="tel-oauth"
              type="tel"
              inputMode="numeric"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0991234567"
              className="input-field"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="btn-primary w-full mt-1"
          >
            {guardando ? 'Guardando…' : (
              <>Continuar al sistema <ArrowRight size={17} /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
