import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { getMiPerfil, actualizarMiPerfil, cambiarMiPassword, subirFotoPerfil } from '../../services/usuarios.service';
import { User, Mail, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Edit3, Camera, Loader2, X, Crown } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function PerfilAdmin() {
  const { user, updateUser } = useAuthStore();
  const [perfil,    setPerfil]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast,     setToast]     = useState(null);

  const [form, setForm] = useState({ nombre_completo: '' });

  // Foto de perfil
  const fileInputRef   = useRef(null);
  const [preview,      setPreview]      = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoBase64,   setFotoBase64]   = useState(null);

  // Contraseña
  const [clave,      setClave]      = useState({ password_actual: '', password_nueva: '', confirmar: '' });
  const [showPass,   setShowPass]   = useState({ actual: false, nueva: false, confirmar: false });
  const [claveError, setClaveError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { usuario } = await getMiPerfil();
        setPerfil(usuario);
        setForm({ nombre_completo: usuario.nombre_completo || '' });
        // Sincronizar foto_perfil al store para Navbar y sidebar
        if (usuario.foto_perfil) updateUser({ foto_perfil: usuario.foto_perfil });
      } catch {
        mostrarToast('error', 'Error al cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const mostrarToast = (tipo, msg) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSeleccionarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { mostrarToast('error', 'Máximo 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); setFotoBase64(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleGuardarFoto = async () => {
    if (!fotoBase64) return;
    setSubiendoFoto(true);
    try {
      const respuesta = await subirFotoPerfil(fotoBase64);
      const usuario = respuesta.usuario ?? respuesta;
      setPerfil(prev => ({ ...prev, foto_perfil: usuario.foto_perfil }));
      updateUser({ foto_perfil: usuario.foto_perfil });
      // Limpiar preview local para mostrar la imagen del servidor
      setPreview(null);
      setFotoBase64(null);
      mostrarToast('ok', '¡Foto actualizada!');
    } catch (e) {
      mostrarToast('error', e.response?.data?.message || 'Error al subir la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!form.nombre_completo.trim()) return mostrarToast('error', 'El nombre es requerido.');
    setGuardando(true);
    try {
      const { usuario } = await actualizarMiPerfil(form);
      setPerfil(prev => ({ ...prev, ...usuario }));
      updateUser({ nombre_completo: usuario.nombre_completo });
      mostrarToast('ok', '¡Perfil actualizado!');
    } catch (e) {
      mostrarToast('error', e.response?.data?.message || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarClave = async (e) => {
    e.preventDefault();
    setClaveError('');
    if (!clave.password_actual || !clave.password_nueva) return setClaveError('Completa todos los campos.');
    if (clave.password_nueva.length < 8) return setClaveError('Mínimo 8 caracteres.');
    if (clave.password_nueva !== clave.confirmar) return setClaveError('Las contraseñas no coinciden.');
    setGuardando(true);
    try {
      await cambiarMiPassword({ password_actual: clave.password_actual, password_nueva: clave.password_nueva });
      setClave({ password_actual: '', password_nueva: '', confirmar: '' });
      mostrarToast('ok', '¡Contraseña cambiada!');
    } catch (e) {
      setClaveError(e.response?.data?.message || 'Contraseña actual incorrecta.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = (n) => n?.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'A';
  const fotoUrl   = preview || (perfil?.foto_perfil ? `${BACKEND_URL}${perfil.foto_perfil}` : null);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 border-4 border-[#0D2137] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
              toast.tipo === 'ok' ? 'bg-green-50 dark:bg-green-500/15 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300'
            }`}
          >
            {toast.tipo === 'ok' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium text-sm">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-display font-bold text-[#0D2137] dark:text-white">Mi Perfil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona tu información de administrador.</p>
      </div>

      {/* Card Hero Admin */}
      <div className="relative bg-gradient-to-br from-[#0D2137] to-[#1A3A5C] dark:from-[#3E2B57] dark:to-[#332247] rounded-3xl p-8 shadow-xl overflow-hidden border border-transparent dark:border-white/8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #B7950B 0%, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row items-center gap-6">

          {/* Avatar */}
          <div className="relative group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[#B7950B]/40 shadow-xl cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {fotoUrl ? (
                <img src={fotoUrl} alt="Foto del administrador" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#B7950B] to-yellow-600 flex items-center justify-center text-white text-3xl font-bold">
                  {iniciales(perfil?.nombre_completo)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </motion.div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#B7950B] rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-600 transition-colors border-2 border-white"
              aria-label="Cambiar foto"
            >
              <Camera size={16} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleSeleccionarFoto} />
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <Crown size={16} className="text-[#B7950B]" />
              <span className="text-[#B7950B] text-xs font-bold uppercase tracking-widest">Administrador</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{perfil?.nombre_completo}</h2>
            <p className="text-white/60 text-sm mt-1">{perfil?.correo}</p>

            <AnimatePresence>
              {fotoBase64 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex gap-2 mt-4 justify-center sm:justify-start">
                  <button type="button" onClick={handleGuardarFoto} disabled={subiendoFoto}
                    className="flex items-center gap-2 px-4 py-2 bg-[#B7950B] text-white text-xs font-bold rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-60">
                    {subiendoFoto ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {subiendoFoto ? 'Guardando...' : 'Guardar foto'}
                  </button>
                  <button type="button" onClick={() => { setPreview(null); setFotoBase64(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                    <X size={14} /> Cancelar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Formulario nombre */}
      <div className="bg-white dark:bg-[#332247] rounded-3xl border border-slate-100 dark:border-white/8 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#0D2137]/10 dark:bg-[#A971D6]/18 rounded-2xl flex items-center justify-center">
            <Edit3 size={20} className="text-[#0D2137] dark:text-[#A971D6]" />
          </div>
          <div>
            <h3 className="font-bold text-[#0D2137] dark:text-white text-lg">Información</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Actualiza tu nombre para mostrar</p>
          </div>
        </div>
        <form onSubmit={handleGuardarPerfil} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Correo electrónico</label>
            <div className="flex items-center gap-3 w-full px-4 py-3 border-2 border-slate-100 dark:border-white/8 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
              <Mail size={18} className="text-slate-400" />
              <span className="text-sm truncate">{perfil?.correo}</span>
              <span className="ml-auto text-[10px] bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">No editable</span>
            </div>
          </div>
          <div>
            <label htmlFor="admin_nombre" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Nombre</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="admin_nombre"
                type="text"
                value={form.nombre_completo}
                onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 rounded-xl focus:border-[#B7950B] focus:outline-none focus:ring-2 focus:ring-[#B7950B]/20 transition-all text-slate-900 dark:text-white text-sm font-medium"
                placeholder="Nombre del administrador"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={guardando}
            className="w-full py-3.5 bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white font-bold rounded-xl hover:bg-[#1A6BAC] dark:hover:brightness-110 shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={18} />
            {guardando ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white dark:bg-[#332247] rounded-3xl border border-slate-100 dark:border-white/8 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-500/15 rounded-2xl flex items-center justify-center">
            <Shield size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-[#0D2137] dark:text-white text-lg">Seguridad</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Cambia tu contraseña de acceso</p>
          </div>
        </div>
        {claveError && (
          <div className="mb-5 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/12 border border-red-200 dark:border-red-500/25 rounded-xl">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{claveError}</p>
          </div>
        )}
        <form onSubmit={handleCambiarClave} className="space-y-4">
          {[['password_actual', 'Contraseña actual', 'actual'], ['password_nueva', 'Nueva contraseña', 'nueva'], ['confirmar', 'Confirmar nueva contraseña', 'confirmar']].map(([key, label, showKey]) => (
            <div key={key}>
              <label htmlFor={`adm_${key}`} className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id={`adm_${key}`}
                  type={showPass[showKey] ? 'text' : 'password'}
                  value={clave[key]}
                  onChange={e => { setClave(p => ({ ...p, [key]: e.target.value })); setClaveError(''); }}
                  className="w-full pl-11 pr-12 py-3 border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 rounded-xl focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all text-slate-900 dark:text-white text-sm font-medium"
                  placeholder={label}
                  autoComplete="new-password"
                />
                <button type="button"
                  onClick={() => setShowPass(p => ({ ...p, [showKey]: !p[showKey] }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPass[showKey] ? 'Ocultar' : 'Mostrar'}>
                  {showPass[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={guardando}
            className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
            <Lock size={18} />
            {guardando ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
