import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, ArrowRight, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { loginRequest } from '../services/auth.service';

import bgAuth   from '../assets/FotosQuintaInes/EntradaQuinta/entrada 1 quinta ines.jpg';
import logoAuth from '../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const irOAuth  = (proveedor) => { window.location.href = `${API_BASE}/api/auth/${proveedor}`; };

export default function Login() {
  const navigate  = useNavigate();
  const { login, redirectAfterLogin, clearRedirect } = useAuthStore();

  const [form,      setForm]      = useState({ correo: '', password: '' });
  const [errores,   setErrores]   = useState({});
  const [apiError,  setApiError]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);

  const validar = (campo, valor) => {
    let msg = '';
    if (campo === 'correo'   && valor && !EMAIL_RE.test(valor)) msg = 'Correo no válido.';
    if (campo === 'password' && valor && valor.length < 8)      msg = 'Mínimo 8 caracteres.';
    setErrores((prev) => ({ ...prev, [campo]: msg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validar(name, value);
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.correo   || !EMAIL_RE.test(form.correo))    errs.correo   = 'Correo electrónico no válido.';
    if (!form.password || form.password.length < 8)       errs.password = 'Mínimo 8 caracteres.';
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const data    = await loginRequest(form);
      login(data.usuario, data.token);
      const destino = redirectAfterLogin ?? '/paquetes';
      clearRedirect();
      navigate(destino, { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundImage: `url(${bgAuth})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlay multicapa para profundidad */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D2137]/75 via-[#0D2137]/55 to-[#1A6BAC]/35" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] glass-card p-9 rounded-3xl shadow-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <img src={logoAuth} alt="Logo Quinta Inés María" className="h-24 w-auto mx-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-xl" />
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-[#0D2137]">Bienvenido de vuelta</h1>
          <p className="mt-1.5 text-slate-600 text-sm font-medium">Ingresa a tu cuenta para continuar</p>
        </div>

        {/* Error API */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm font-medium">{apiError}</p>
          </motion.div>
        )}

        {/* OAuth */}
        <div className="space-y-2.5 mb-6">
          <OAuthButton onClick={() => irOAuth('google')} label="Continuar con Google">
            <GoogleSVG />
          </OAuthButton>
          <OAuthButton onClick={() => irOAuth('microsoft')} label="Continuar con Microsoft">
            <MicrosoftSVG />
          </OAuthButton>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-300/50" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">o con tu correo</span>
          <div className="flex-1 h-px bg-slate-300/50" />
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <InputField
            id="correo" name="correo" type="email"
            label="Correo electrónico" placeholder="tu@correo.com"
            value={form.correo} onChange={handleChange}
            error={errores.correo} autoComplete="email"
            icon={<Mail size={16} />}
          />
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-2">Contraseña</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock size={16} />
              </div>
              <input
                id="password" name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                className={`input-field pl-11 pr-12 ${errores.password ? 'error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C9A227] transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errores.password && <p className="mt-1.5 text-xs text-red-600 font-medium">{errores.password}</p>}
          </div>

          <div className="text-right">
            <Link to="/recuperar-clave" className="text-sm text-[#C9A227] hover:text-[#B7950B] font-semibold transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ingresando…
              </span>
            ) : (
              <>Ingresar <ArrowRight size={17} /></>
            )}
          </button>
        </form>

        <div className="mt-7 text-center text-sm border-t border-slate-200/60 pt-6">
          <p className="text-slate-700 font-medium">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-bold text-[#C9A227] hover:text-[#B7950B] transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

/* ── Sub-componentes ── */
function OAuthButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/80 hover:bg-white border border-slate-200/80 rounded-xl font-semibold text-slate-700 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md backdrop-blur-sm"
    >
      {children}
      {label}
    </button>
  );
}

function InputField({ id, name, type = 'text', label, placeholder, value, onChange, error, autoComplete, icon }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id} name={name} type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          className={`input-field ${icon ? 'pl-11' : ''} ${error ? 'error' : ''}`}
          aria-invalid={!!error}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

function GoogleSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

function MicrosoftSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  );
}
