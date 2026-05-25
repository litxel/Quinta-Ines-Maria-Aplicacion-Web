import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { nuevaClaveRequest } from '../services/auth.service';

// IMPORTAMOS LOS ASSETS PARA EL FONDO COMPLETO
import bgAuth from '../assets/FotosQuintaInes/EntradaQuinta/entrada 5 quinta ines.jpg';
import logoAuth from '../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

const PASS_RE = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export default function NuevaClave() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [exito, setExito] = useState(false);

  const validar = (name, value) => {
    let msg = '';
    if (name === 'password') {
      if (value.length < 8) msg = 'Mínimo 8 caracteres.';
      else if (!PASS_RE.test(value)) msg = 'Debe incluir mayúscula, minúscula y número.';
    }
    if (name === 'confirmar' && value !== form.password) msg = 'Las contraseñas no coinciden.';
    setErrores((prev) => ({ ...prev, [name]: msg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validar(name, value);
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setApiError('Enlace inválido o expirado.'); return; }
    
    const errs = {};
    if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres.';
    else if (!PASS_RE.test(form.password)) errs.password = 'Debe incluir mayúscula, minúscula y número.';
    if (form.password !== form.confirmar) errs.confirmar = 'Las contraseñas no coinciden.';
    
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }

    setLoading(true);
    try {
      await nuevaClaveRequest({ token, password: form.password });
      setExito(true);
      setTimeout(() => navigate('/login'), 4000); // Redirige al login después de 4 seg
    } catch (err) {
      setApiError(err.response?.data?.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

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
    <main className="min-h-screen relative flex items-center justify-center p-4 font-sans overflow-hidden">
      
      {/* ── FONDO DIFUMINADO TIPO LOGIN ── */}
      <div className="absolute inset-0 z-0">
        <img src={bgAuth} alt="Fondo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0D2137]/40"></div>
      </div>

      {/* ── TARJETA TIPO GLASSMORPHISM ── */}
      <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-lg p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/40">
        
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group">
            <img src={logoAuth} alt="Logo" className="h-20 w-auto mx-auto group-hover:scale-105 transition-transform" />
          </Link>
        </div>

        {exito ? (
          <div className="text-center animate-in zoom-in duration-500">
            <h2 className="font-display text-2xl font-bold text-[#0D2137] mb-2">¡Contraseña Guardada!</h2>
            <p className="text-[#0D2137]/80 font-medium mb-6">Serás redirigido al inicio de sesión en unos segundos...</p>
            <Link to="/login" className="inline-block w-full py-3 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-md transition-all">
              Ir ahora
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-[#0D2137] mb-1">Nueva Contraseña</h2>
              <p className="text-[#0D2137]/70 text-sm font-medium">Crea una clave segura para tu cuenta.</p>
            </div>

            {apiError && (
              <div className="mb-4 p-3 bg-red-100/80 border border-red-300 rounded-xl text-red-700 text-sm font-bold text-center">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Campo Contraseña */}
              <div>
                <label className="block text-sm font-bold text-[#0D2137] mb-1.5">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mín. 8 caracteres"
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                      errores.password ? 'border-red-400 bg-red-50/80' : 'border-white/50 bg-white/60 focus:bg-white/90 focus:ring-[#0D2137]/30'
                    } text-[#0D2137]`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0D2137]/60">
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {/* Barra de Fuerza */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="flex-1 rounded-full" style={{ backgroundColor: n <= fuerzaPass ? fuerzaColor : '#ffffff80' }} />
                      ))}
                    </div>
                    <p className="text-[10px] mt-1 font-bold uppercase" style={{ color: fuerzaColor }}>{fuerzaLabel}</p>
                  </div>
                )}
                {errores.password && <p className="mt-1 text-xs text-red-600 font-bold">{errores.password}</p>}
              </div>

              {/* Campo Confirmar */}
              <div>
                <label className="block text-sm font-bold text-[#0D2137] mb-1.5">Confirmar contraseña</label>
                <input
                  type="password"
                  name="confirmar"
                  value={form.confirmar}
                  onChange={handleChange}
                  placeholder="Repítela por favor"
                  className={`w-full px-4 py-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                    errores.confirmar ? 'border-red-400 bg-red-50/80' : 'border-white/50 bg-white/60 focus:bg-white/90 focus:ring-[#0D2137]/30'
                  } text-[#0D2137]`}
                />
                {errores.confirmar && <p className="mt-1 text-xs text-red-600 font-bold">{errores.confirmar}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-lg transition-all disabled:opacity-60 hover:-translate-y-0.5"
              >
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}