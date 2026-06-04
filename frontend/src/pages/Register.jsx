import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../services/auth.service';

// IMPORTAMOS LAS IMÁGENES (Usamos bgAuth para el fondo completo)
import bgAuth from '../assets/FotosQuintaInes/EntradaQuinta/entrada 1 quinta ines.jpg';
import logoAuth from '../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASS_RE  = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const PHONE_RE = /^[0-9]{9,10}$/;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ 
    nombre_completo: '', 
    correo: '', 
    telefono: '', 
    password: '', 
    confirmar: '' 
  });
  
  const [errores, setErrores] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validarCampo = (name, value) => {
    let msg = '';
    switch (name) {
      case 'nombre_completo':
        if (value && value.trim().length < 2) {
          msg = 'Mínimo 2 caracteres.';
        }
        break;
      case 'correo':
        if (value && !EMAIL_RE.test(value)) {
          msg = 'Correo no válido.';
        }
        break;
      case 'telefono':
        if (value && !PHONE_RE.test(value)) {
          msg = 'Debe contener 10 dígitos (Ej: 0991234567).';
        }
        break;
      case 'password':
        if (value && value.length < 8) {
          msg = 'Mínimo 8 caracteres.';
        } else if (value && !PASS_RE.test(value)) {
          msg = 'Debe incluir mayúscula, minúscula y número.';
        }
        break;
      case 'confirmar':
        if (value && value !== form.password) {
          msg = 'Las contraseñas no coinciden.';
        }
        break;
      default:
        break;
    }
    setErrores((prev) => ({ ...prev, [name]: msg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Evitar que escriban letras en el teléfono
    if (name === 'telefono' && value !== '' && !/^[0-9]+$/.test(value)) {
      return;
    }
    
    setForm((prev) => ({ ...prev, [name]: value }));
    validarCampo(name, value);
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    
    if (!form.nombre_completo || form.nombre_completo.trim().length < 2) {
      errs.nombre_completo = 'Requerido (mín. 2 caracteres).';
    }
    if (!form.correo || !EMAIL_RE.test(form.correo)) {
      errs.correo = 'Correo electrónico no válido.';
    }
    if (!form.telefono || !PHONE_RE.test(form.telefono)) {
      errs.telefono = 'Teléfono requerido (10 dígitos).';
    }
    if (!form.password || form.password.length < 8) {
      errs.password = 'Mínimo 8 caracteres.';
    } else if (!PASS_RE.test(form.password)) {
      errs.password = 'Debe incluir mayúscula, minúscula y número.';
    }
    if (form.password !== form.confirmar) {
      errs.confirmar = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(errs).length > 0) { 
      setErrores(errs); 
      return; 
    }

    setLoading(true);
    try {
      await registerRequest({
        nombre_completo: form.nombre_completo,
        correo: form.correo,
        telefono: form.telefono,
        password: form.password,
      });
      setExito(true);
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito (Rediseñada para combinar con Glassmorphism) ──
  if (exito) {
    return (
      <main 
        className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat font-sans"
        style={{ backgroundImage: `url(${bgAuth})` }}
      >
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="relative z-10 max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white">
            <span className="text-5xl">✉️</span>
          </div>
          
          <h2 className="font-display text-3xl font-bold text-[#0D2137] mb-4">
            ¡Cuenta creada!
          </h2>
          
          <p className="text-slate-800 leading-relaxed mb-8 font-medium">
            Revisa tu bandeja de entrada en <strong className="text-[#0D2137] bg-white/50 px-1 rounded">{form.correo}</strong> y haz clic en el enlace de verificación para activar tu cuenta.
          </p>
          
          <Link 
            to="/login" 
            className="inline-block w-full py-4 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-lg transition-all hover:-translate-y-0.5"
          >
            Ir a Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  // ── Fuerza de contraseña ──
  const fuerzaPass = (() => {
    const p = form.password;
    if (!p) return 0;
    let pts = 0;
    if (p.length >= 8) pts++;
    if (/[A-Z]/.test(p)) pts++;
    if (/[a-z]/.test(p)) pts++;
    if (/\d/.test(p)) pts++;
    if (/[^A-Za-z\d]/.test(p)) pts++;
    return pts;
  })();
  
  const fuerzaColor = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#16A34A'][fuerzaPass];
  const fuerzaLabel = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'][fuerzaPass];

  return (
    <main 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${bgAuth})` }}
    >
      <div className="absolute inset-0 bg-black/35 z-0"></div>

      {/* ── PANEL DE REGISTRO CON EFECTO DIFUMINADO (GLASSMORPHISM) ── */}
      <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 my-8 animate-in fade-in zoom-in duration-500 overflow-y-auto max-h-[90vh]">
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <img 
              src={logoAuth} 
              alt="Logo Quinta Inés María" 
              className="h-20 w-auto mx-auto group-hover:scale-105 transition-transform" 
            />
          </Link>
          <h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-[#0D2137]">
            Crear tu cuenta
          </h1>
          <p className="mt-2 text-slate-700 font-medium">
            Únete para planificar tu evento soñado.
          </p>
        </div>

        {apiError && (
          <div role="alert" className="mb-6 p-4 bg-red-100/80 backdrop-blur-sm border border-red-300 rounded-xl flex items-start gap-3 shadow-sm">
            <span className="text-red-600 mt-0.5 shrink-0">⚠️</span>
            <p className="text-red-800 text-sm font-medium">
              {apiError}
            </p>
          </div>
        )}

        {/* ── BOTONES OAUTH ── */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => alert('🚧 Próximamente: Registro con Google estará disponible en la siguiente actualización.')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 text-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 focus:outline-none"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Registrarme con Google
          </button>
          <button
            type="button"
            onClick={() => alert('🚧 Próximamente: Registro con Microsoft estará disponible en la siguiente actualización.')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 text-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 focus:outline-none"
          >
            <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Registrarme con Microsoft
          </button>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-300/60" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">o con tu correo</span>
          <div className="flex-1 h-px bg-slate-300/60" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          
          <Campo
            label="Nombre completo" 
            id="nombre_completo" 
            name="nombre_completo"
            value={form.nombre_completo} 
            onChange={handleChange} 
            error={errores.nombre_completo}
            placeholder="María García López" 
            autoComplete="name"
          />

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

          <Campo
            label="Teléfono / Celular (WhatsApp)" 
            id="telefono" 
            name="telefono" 
            type="tel"
            value={form.telefono} 
            onChange={handleChange} 
            error={errores.telefono}
            placeholder="099 123 4567" 
            autoComplete="tel"
          />

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password" 
                name="password" 
                type={showPass ? 'text' : 'password'}
                value={form.password} 
                onChange={handleChange}
                placeholder="Mín. 8 caracteres" 
                autoComplete="new-password"
                className={inputClass(errores.password)}
                aria-describedby="pass-hint err-password"
              />
              <button
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#B7950B] text-sm transition-colors focus:outline-none"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            
            {/* Barra de fuerza */}
            {form.password && (
              <div className="mt-2.5 bg-white/50 p-2 rounded-lg border border-slate-200">
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div 
                      key={n} 
                      className="flex-1 rounded-full transition-colors" 
                      style={{ backgroundColor: n <= fuerzaPass ? fuerzaColor : '#E5E7EB' }} 
                    />
                  ))}
                </div>
                <p 
                  className="text-[11px] mt-1.5 font-bold uppercase tracking-wider text-center" 
                  style={{ color: fuerzaColor }}
                >
                  {fuerzaLabel}
                </p>
              </div>
            )}
            
            {!errores.password && !form.password && (
              <p id="pass-hint" className="mt-1.5 text-xs text-slate-600 font-medium bg-white/50 inline-block px-2 rounded">
                Debe incluir mayúscula, minúscula y número.
              </p>
            )}
            
            {errores.password && (
              <p id="err-password" className="mt-1.5 text-xs text-red-600 font-medium bg-white/50 inline-block px-2 rounded">
                {errores.password}
              </p>
            )}
          </div>

          <Campo
            label="Confirmar contraseña" 
            id="confirmar" 
            name="confirmar" 
            type="password"
            value={form.confirmar} 
            onChange={handleChange} 
            error={errores.confirmar}
            placeholder="Repite la contraseña" 
            autoComplete="new-password"
          />

          <button
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-2 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-lg transition-all disabled:opacity-60 hover:-translate-y-0.5"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm border-t border-slate-200 pt-6">
          <p className="text-slate-800 font-medium">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-[#B7950B] hover:text-[#9A7D0A] transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

// Estilos de input adaptados para fondo traslúcido
function inputClass(error) {
  return `w-full px-4 py-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 bg-white/50 ${
    error 
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
      : 'border-slate-300 focus:border-[#B7950B] focus:ring-[#B7950B]/30 focus:bg-white'
  } placeholder:text-slate-500 text-slate-900 font-medium`;
}

function Campo({ label, id, name, type = 'text', value, onChange, error, placeholder, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 mb-1.5">
        {label}
      </label>
      <input
        id={id} 
        name={name} 
        type={type} 
        value={value} 
        onChange={onChange}
        placeholder={placeholder} 
        autoComplete={autoComplete}
        className={inputClass(error)}
        aria-describedby={error ? `err-${id}` : undefined} 
        aria-invalid={!!error}
      />
      {error && (
        <p id={`err-${id}`} className="mt-1.5 text-xs text-red-600 font-medium bg-white/50 inline-block px-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
}