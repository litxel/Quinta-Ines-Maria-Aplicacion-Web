import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recuperarClaveRequest } from '../services/auth.service';

// IMPORTAMOS LOS ASSETS PARA EL FONDO COMPLETO
import bgAuth from '../assets/FotosQuintaInes/EntradaQuinta/entrada 3 quinta ines.jpg';
import logoAuth from '../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecuperarClave() {
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
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
      setEnviado(true); // Protección OWASP
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 font-sans overflow-hidden">
      
      {/* ── FONDO DIFUMINADO TIPO LOGIN ── */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgAuth} 
          alt="Fondo Quinta Inés María" 
          className="w-full h-full object-cover" 
        />
        {/* Overlay oscuro para resaltar la tarjeta de vidrio */}
        <div className="absolute inset-0 bg-[#0D2137]/40"></div>
      </div>

      {/* ── TARJETA TIPO GLASSMORPHISM (Igual al Login) ── */}
      <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-lg p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/40">
        
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group">
            <img src={logoAuth} alt="Logo" className="h-20 w-auto mx-auto group-hover:scale-105 transition-transform" />
          </Link>
        </div>

        {enviado ? (
          /* ── Estado Enviado ── */
          <div className="text-center animate-in zoom-in duration-500">
            <h2 className="font-display text-2xl font-bold text-[#0D2137] mb-4">Revisa tu correo</h2>
            <p className="text-[#0D2137]/80 font-medium leading-relaxed mb-6">
              Si el correo es correcto, recibirás un enlace de recuperación pronto. Revisa tu carpeta de Spam.
            </p>
            <Link to="/login" className="inline-block w-full py-3.5 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-md transition-all hover:-translate-y-0.5">
              Volver al inicio
            </Link>
          </div>
        ) : (
          /* ── Formulario ── */
          <>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-[#0D2137] mb-2">¿Olvidaste tu clave?</h2>
              <p className="text-[#0D2137]/70 font-medium text-sm">Ingresa tu correo para recibir las instrucciones.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="correo" className="block text-sm font-bold text-[#0D2137] mb-1.5 text-left">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => { setCorreo(e.target.value); setError(''); }}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  className={`w-full px-4 py-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                    error
                      ? 'border-red-400 bg-red-50/80 focus:ring-red-400'
                      : 'border-white/50 bg-white/60 focus:bg-white/90 focus:border-[#0D2137] focus:ring-[#0D2137]/30'
                  } text-[#0D2137] placeholder-[#0D2137]/50`}
                />
                {error && <p className="mt-1.5 text-xs text-red-600 font-bold text-left">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-lg transition-all disabled:opacity-60 hover:-translate-y-0.5 mt-2"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>

              <p className="text-center text-sm pt-4">
                <Link to="/login" className="text-[#B7950B] hover:text-[#0D2137] font-bold transition-colors">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}