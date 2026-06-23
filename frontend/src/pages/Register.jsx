import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, ArrowRight, User, Mail, Phone, Lock, CheckCircle2 } from 'lucide-react';
import { registerRequest } from '../services/auth.service';

import bgAuth   from '../assets/FotosQuintaInes/EntradaQuinta/entrada 1 quinta ines.jpg';
import logoAuth from '../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASS_RE  = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const PHONE_RE = /^[0-9]{9,10}$/;
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const irOAuth  = (proveedor) => { window.location.href = `${API_BASE}/api/auth/${proveedor}`; };

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre_completo: '', correo: '', telefono: '', password: '', confirmar: '' });
  const [errores,  setErrores]  = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [exito,    setExito]    = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validarCampo = (name, value) => {
    let msg = '';
    if (name === 'nombre_completo' && value && value.trim().length < 2)     msg = 'Mínimo 2 caracteres.';
    if (name === 'correo'          && value && !EMAIL_RE.test(value))         msg = 'Correo no válido.';
    if (name === 'telefono'        && value && !PHONE_RE.test(value))         msg = 'Debe contener 9 o 10 dígitos.';
    if (name === 'password'        && value && value.length < 8)              msg = 'Mínimo 8 caracteres.';
    else if (name === 'password'   && value && !PASS_RE.test(value))          msg = 'Debe incluir mayúscula, minúscula y número.';
    if (name === 'confirmar'       && value && value !== form.password)       msg = 'Las contraseñas no coinciden.';
    setErrores((prev) => ({ ...prev, [name]: msg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefono' && value !== '' && !/^[0-9]+$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
    validarCampo(name, value);
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.nombre_completo || form.nombre_completo.trim().length < 2) errs.nombre_completo = 'Requerido (mín. 2 caracteres).';
    if (!form.correo || !EMAIL_RE.test(form.correo))                     errs.correo           = 'Correo electrónico no válido.';
    if (!form.telefono || !PHONE_RE.test(form.telefono))                 errs.telefono         = 'Teléfono requerido (9-10 dígitos).';
    if (!form.password || form.password.length < 8)                      errs.password         = 'Mínimo 8 caracteres.';
    else if (!PASS_RE.test(form.password))                               errs.password         = 'Debe incluir mayúscula, minúscula y número.';
    if (form.password !== form.confirmar)                                errs.confirmar        = 'Las contraseñas no coinciden.';
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }

    setLoading(true);
    try {
      await registerRequest({ nombre_completo: form.nombre_completo, correo: form.correo, telefono: form.telefono, password: form.password });
      setExito(true);
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Fuerza de contraseña ── */
  const fuerzaPass = (() => {
    const p = form.password;
    if (!p) return 0;
    let pts = 0;
    if (p.length >= 8)        pts++;
    if (/[A-Z]/.test(p))     pts++;
    if (/[a-z]/.test(p))     pts++;
    if (/\d/.test(p))        pts++;
    if (/[^A-Za-z\d]/.test(p)) pts++;
    return pts;
  })();
  const fuerzaColor = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#16A34A'][fuerzaPass];
  const fuerzaLabel = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'][fuerzaPass];

  /* ── Pantalla de éxito ── */
  if (exito) {
    return (
      <main
        className="min-h-screen w-full flex items-center justify-center p-4 relative"
        style={{ backgroundImage: `url(${bgAuth})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D2137]/75 via-[#0D2137]/55 to-[#1A6BAC]/35" />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md w-full glass-card rounded-3xl shadow-2xl p-10 text-center"
        >
          <div className="w-24 h-24 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/60 shadow-xl">
            <CheckCircle2 size={44} className="text-green-600" />
          </div>
          <h2 className="font-display text-4xl font-bold text-[#0D2137] dark:text-white mb-3">¡Cuenta creada!</h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-8 font-medium">
            Revisa tu bandeja en <strong className="text-[#0D2137] dark:text-white font-bold">{form.correo}</strong> y haz clic en el enlace de verificación para activar tu cuenta.
          </p>
          <Link to="/login" className="btn-primary w-full justify-center">
            Ir a Iniciar sesión <ArrowRight size={17} />
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundImage: `url(${bgAuth})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D2137]/75 via-[#0D2137]/55 to-[#1A6BAC]/35" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] glass-card p-9 rounded-3xl shadow-2xl my-8 overflow-y-auto max-h-[92vh]"
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-block group">
            <img src={logoAuth} alt="Logo Quinta Inés María" className="h-20 w-auto mx-auto group-hover:scale-105 transition-transform drop-shadow-xl" />
          </Link>
          <h1 className="mt-5 font-display text-3xl font-bold text-[#0D2137] dark:text-white">Crear tu cuenta</h1>
          <p className="mt-1.5 text-slate-600 dark:text-slate-300 text-sm font-medium">Únete para planificar tu evento soñado.</p>
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 bg-red-50/90 border border-red-200 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm font-medium">{apiError}</p>
          </motion.div>
        )}

        {/* OAuth */}
        <div className="space-y-2.5 mb-5">
          <OAuthButton onClick={() => irOAuth('google')} label="Registrarme con Google"><GoogleSVG /></OAuthButton>
          <OAuthButton onClick={() => irOAuth('microsoft')} label="Registrarme con Microsoft"><MicrosoftSVG /></OAuthButton>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-300/50" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">o con tu correo</span>
          <div className="flex-1 h-px bg-slate-300/50" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Campo label="Nombre completo"         id="nombre_completo" name="nombre_completo" value={form.nombre_completo} onChange={handleChange} error={errores.nombre_completo} placeholder="María García López" autoComplete="name"         icon={<User size={15} />} />
          <Campo label="Correo electrónico"      id="correo"          name="correo"          value={form.correo}          onChange={handleChange} error={errores.correo}          placeholder="tu@correo.com"    autoComplete="email"        icon={<Mail size={15} />} type="email" />
          <Campo label="Teléfono (WhatsApp)"     id="telefono"        name="telefono"        value={form.telefono}        onChange={handleChange} error={errores.telefono}        placeholder="0991234567"       autoComplete="tel"          icon={<Phone size={15} />} type="tel" />

          {/* Contraseña con indicador de fuerza */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Contraseña</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Lock size={15} /></div>
              <input
                id="password" name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                placeholder="Mín. 8 caracteres" autoComplete="new-password"
                className={`input-field pl-11 pr-12 ${errores.password ? 'error' : ''}`}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C9A227] transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {form.password && (
              <div className="mt-2.5 px-3 py-2 bg-white/55 rounded-xl border border-slate-200/60">
                <div className="flex gap-1 h-1.5">
                  {[1,2,3,4,5].map((n) => (
                    <div key={n} className="flex-1 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: n <= fuerzaPass ? fuerzaColor : '#E5E7EB' }} />
                  ))}
                </div>
                <p className="text-[11px] mt-1.5 font-bold uppercase tracking-wider text-center"
                  style={{ color: fuerzaColor }}>{fuerzaLabel}</p>
              </div>
            )}
            {!form.password && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">Mayúscula, minúscula y número.</p>}
            {errores.password && <p className="mt-1.5 text-xs text-red-600 font-medium">{errores.password}</p>}
          </div>

          <Campo label="Confirmar contraseña" id="confirmar" name="confirmar" type="password" value={form.confirmar} onChange={handleChange} error={errores.confirmar} placeholder="Repite la contraseña" autoComplete="new-password" icon={<Lock size={15} />} />

          <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando cuenta…
              </span>
            ) : (
              <>Crear cuenta <ArrowRight size={17} /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm border-t border-slate-200/60 dark:border-white/10 pt-5">
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-bold text-[#C9A227] hover:text-[#B7950B] transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function OAuthButton({ onClick, label, children }) {
  return (
    <button
      type="button" onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/80 hover:bg-white border border-slate-200/80 rounded-xl font-semibold text-slate-700 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md backdrop-blur-sm"
    >
      {children}{label}
    </button>
  );
}

function Campo({ label, id, name, type = 'text', value, onChange, error, placeholder, autoComplete, icon }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>}
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
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
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
