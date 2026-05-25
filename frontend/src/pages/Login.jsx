import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { loginRequest } from '../services/auth.service';

// IMPORTAMOS LAS IMÁGENES (Rutas basadas en tu estructura assets)
import bgAuth from '../assets/FotosQuintaInes/EntradaQuinta/entrada 1 quinta ines.jpg';
import logoAuth from '../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const { login, redirectAfterLogin, clearRedirect } = useAuthStore();

  const [form, setForm] = useState({ correo: '', password: '' });
  const [errores, setErrores] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validar = (campo, valor) => {
    let msg = '';
    if (campo === 'correo' && valor && !EMAIL_RE.test(valor)) msg = 'Correo no válido.';
    if (campo === 'password' && valor && valor.length < 8) msg = 'Mínimo 8 caracteres.';
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
    if (!form.correo) errs.correo = 'El correo es requerido.';
    else if (!EMAIL_RE.test(form.correo)) errs.correo = 'Correo no válido.';
    if (!form.password) errs.password = 'La contraseña es requerida.';
    else if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres.';
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const data = await loginRequest(form);
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
    // CONTENEDOR PRINCIPAL CON IMAGEN DE FONDO COMPLETA
    <main 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${bgAuth})` }}
    >
      {/* CAPA DE OVERLAY OSCURO SUTIL PARA MEJORAR CONTRASTE */}
      <div className="absolute inset-0 bg-black/30 z-0"></div>

      {/* ── PANEL DE LOGIN CON EFECTO DIFUMINADO (GLASSMORPHISM) ── */}
      <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <img src={logoAuth} alt="Logo Quinta Inés María" className="h-24 w-auto mx-auto group-hover:scale-105 transition-transform" />
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-[#0D2137]">Bienvenido</h1>
          <p className="mt-2 text-slate-700 font-medium">Inicia sesión para gestionar tus eventos.</p>
        </div>

        {apiError && (
          <div role="alert" className="mb-6 p-4 bg-red-100/80 backdrop-blur-sm border border-red-300 rounded-xl flex items-start gap-3 shadow-sm">
            <span className="text-red-600 mt-0.5 shrink-0">⚠️</span>
            <p className="text-red-800 text-sm font-medium">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Campo
            label="Correo electrónico"
            id="correo"
            name="correo"
            type="email"
            value={form.correo}
            onChange={handleChange}
            error={errores.correo}
            placeholder="tu@correo.com"
            autoComplete="email"
          />

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800">Contraseña</label>
              <Link to="/recuperar-clave" className="text-xs text-[#B7950B] hover:text-[#9A7D0A] font-semibold transition-colors" tabIndex={-1}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className={inputClass(errores.password)}
                aria-describedby={errores.password ? 'err-password' : undefined}
                aria-invalid={!!errores.password}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#B7950B] text-sm transition-colors focus:outline-none"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {errores.password && <p id="err-password" className="mt-1.5 text-xs text-red-600 font-medium bg-white/50 inline-block px-2 rounded">{errores.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-lg hover:shadow-xl transition-all disabled:opacity-60 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] focus:ring-offset-2"
          >
            {loading ? 'Autenticando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-10 text-center text-sm border-t border-slate-200 pt-8">
          <p className="text-slate-800 font-medium">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-[#B7950B] hover:text-[#9A7D0A] transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}

// Estilos de input adaptados para fondo traslúcido
function inputClass(error) {
  return `w-full px-4 py-3.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 bg-white/50 ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/50'
      : 'border-slate-300 focus:border-[#B7950B] focus:ring-[#B7950B]/30 focus:bg-white'
  } placeholder:text-slate-500 text-slate-900 font-medium`;
}

function Campo({ label, id, name, type = 'text', value, onChange, error, placeholder, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 mb-1.5">{label}</label>
      <input
        id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        className={inputClass(error)}
        aria-describedby={error ? `err-${id}` : undefined}
        aria-invalid={!!error}
      />
      {error && <p id={`err-${id}`} className="mt-1.5 text-xs text-red-600 font-medium bg-white/50 inline-block px-2 rounded">{error}</p>}
    </div>
  );
}