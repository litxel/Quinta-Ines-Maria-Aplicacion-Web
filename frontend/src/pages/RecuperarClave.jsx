import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { recuperarClaveRequest } from '../services/auth.service';

import bgAuth   from '../assets/FotosQuintaInes/EntradaQuinta/entrada 3 quinta ines.jpg';
import logoAuth from '../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecuperarClave() {
  const [correo,  setCorreo]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(correo)) { setError('Ingresa un correo válido.'); return; }
    setLoading(true);
    setError('');
    try {
      await recuperarClaveRequest(correo);
      setEnviado(true);
    } catch {
      setEnviado(true); // OWASP: no revelar si el correo existe
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundImage: `url(${bgAuth})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D2137]/72 via-[#0D2137]/52 to-[#1A6BAC]/30" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[400px] glass-card p-9 rounded-3xl shadow-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <img src={logoAuth} alt="Logo" className="h-20 w-auto mx-auto group-hover:scale-105 transition-transform drop-shadow-xl" />
          </Link>
        </div>

        {enviado ? (
          /* ── Estado enviado ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-green-100/80 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/60 shadow-xl">
              <CheckCircle2 size={38} className="text-green-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-[#0D2137] mb-3">Revisa tu correo</h2>
            <p className="text-slate-700 font-medium leading-relaxed mb-8 text-sm">
              Si el correo es correcto, recibirás un enlace de recuperación en breve. No olvides revisar tu carpeta de Spam.
            </p>
            <Link to="/login" className="btn-primary w-full justify-center">
              Volver al inicio <ArrowRight size={17} />
            </Link>
          </motion.div>
        ) : (
          /* ── Formulario ── */
          <>
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-[#0D2137] mb-2">¿Olvidaste tu clave?</h2>
              <p className="text-slate-600 font-medium text-sm leading-relaxed">
                Ingresa tu correo y te enviaremos las instrucciones para recuperarla.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="correo" className="block text-sm font-semibold text-slate-800 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail size={16} />
                  </div>
                  <input
                    id="correo" type="email" value={correo}
                    onChange={(e) => { setCorreo(e.target.value); setError(''); }}
                    placeholder="tu@correo.com" autoComplete="email"
                    className={`input-field pl-11 ${error ? 'error' : ''}`}
                  />
                </div>
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <AlertCircle size={13} />
                    <p className="text-xs font-medium">{error}</p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando…
                  </span>
                ) : (
                  <>Enviar enlace de recuperación <ArrowRight size={17} /></>
                )}
              </button>
            </form>

            <div className="mt-7 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#C9A227] hover:text-[#B7950B] transition-colors"
              >
                <ArrowLeft size={15} /> Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
}
