import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { getMiPerfil, actualizarMiPerfil, cambiarMiPassword, subirFotoPerfil } from '../../services/usuarios.service';
import { User, Phone, Mail, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Edit3, Camera, Loader2, X } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function MiPerfil() {
  const { user, updateUser } = useAuthStore();
  const [perfil,    setPerfil]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast,     setToast]     = useState(null);

  // Formulario de datos personales
  const [form, setForm] = useState({ nombre_completo: '', telefono: '' });

  // Foto de perfil
  const fileInputRef   = useRef(null);
  const [preview,      setPreview]      = useState(null); // URL local para preview
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoBase64,   setFotoBase64]   = useState(null); // base64 pendiente de guardar

  // Formulario de cambio de clave
  const [clave,      setClave]      = useState({ password_actual: '', password_nueva: '', confirmar: '' });
  const [showPass,   setShowPass]   = useState({ actual: false, nueva: false, confirmar: false });
  const [claveError, setClaveError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { usuario } = await getMiPerfil();
        setPerfil(usuario);
        setForm({ nombre_completo: usuario.nombre_completo || '', telefono: usuario.telefono || '' });
        // Sincronizar foto_perfil al store para que el Navbar lo muestre
        if (usuario.foto_perfil) updateUser({ foto_perfil: usuario.foto_perfil });
      } catch {
        mostrarToast('error', 'Error al cargar tu perfil.');
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

  // ── Manejo de foto ──────────────────────────────────────────────────────────
  const handleSeleccionarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      mostrarToast('error', 'La imagen no puede superar 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setFotoBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardarFoto = async () => {
    if (!fotoBase64) return;
    setSubiendoFoto(true);
    try {
      const respuesta = await subirFotoPerfil(fotoBase64);
      const usuario = respuesta.usuario ?? respuesta;
      // Actualizar el perfil local y el store con la URL del servidor
      setPerfil(prev => ({ ...prev, foto_perfil: usuario.foto_perfil }));
      updateUser({ foto_perfil: usuario.foto_perfil });
      // Limpiar el preview local para mostrar la imagen del servidor
      setPreview(null);
      setFotoBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      mostrarToast('ok', '¡Foto de perfil actualizada!');
    } catch (e) {
      mostrarToast('error', e.response?.data?.message || 'Error al subir la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const cancelarFoto = () => {
    setPreview(null);
    setFotoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Guardar perfil ──────────────────────────────────────────────────────────
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!form.nombre_completo.trim()) return mostrarToast('error', 'El nombre es requerido.');
    setGuardando(true);
    try {
      const { usuario } = await actualizarMiPerfil(form);
      setPerfil(prev => ({ ...prev, ...usuario }));
      updateUser({ nombre_completo: usuario.nombre_completo });
      mostrarToast('ok', '¡Perfil actualizado correctamente!');
    } catch (e) {
      mostrarToast('error', e.response?.data?.message || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  // ── Cambiar contraseña ──────────────────────────────────────────────────────
  const handleCambiarClave = async (e) => {
    e.preventDefault();
    setClaveError('');
    if (!clave.password_actual || !clave.password_nueva) return setClaveError('Completa todos los campos.');
    if (clave.password_nueva.length < 8) return setClaveError('La nueva contraseña debe tener al menos 8 caracteres.');
    if (clave.password_nueva !== clave.confirmar) return setClaveError('Las contraseñas nuevas no coinciden.');
    setGuardando(true);
    try {
      await cambiarMiPassword({ password_actual: clave.password_actual, password_nueva: clave.password_nueva });
      setClave({ password_actual: '', password_nueva: '', confirmar: '' });
      mostrarToast('ok', '¡Contraseña cambiada correctamente!');
    } catch (e) {
      setClaveError(e.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = (nombre) => nombre?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  const fotoUrl   = preview || (perfil?.foto_perfil ? `${BACKEND_URL}${perfil.foto_perfil}` : null);

  if (loading) return (
    <main className="min-h-screen pt-28 pb-16 bg-[#FDF8F0] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-[#0D2137] border-t-transparent rounded-full" />
    </main>
  );

  return (
    <main className="min-h-screen pt-28 pb-16 bg-[#FDF8F0]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
              toast.tipo === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.tipo === 'ok' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium text-sm">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center pt-8 mb-10">
          <h1 className="font-display text-4xl font-bold text-[#0D2137]">Mi Perfil</h1>
          <p className="mt-2 text-slate-500 text-sm">Administra tu información personal y seguridad</p>
        </div>

        {/* Avatar + Info card */}
        <div className="relative bg-gradient-to-br from-[#0D2137] to-[#1A3A5C] rounded-3xl p-8 mb-8 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #B7950B 0%, transparent 60%)' }} />
          <div className="relative flex flex-col sm:flex-row items-center gap-6">

            {/* ── AVATAR CON BOTÓN DE CÁMARA ── */}
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/20 shadow-xl cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Haz clic para cambiar tu foto"
              >
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#B7950B] flex items-center justify-center text-white text-3xl font-bold">
                    {iniciales(perfil?.nombre_completo)}
                  </div>
                )}
                {/* Overlay al hacer hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              </motion.div>

              {/* Botón de cámara pequeño */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#B7950B] rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-600 transition-colors border-2 border-white"
                title="Cambiar foto"
                aria-label="Cambiar foto de perfil"
              >
                <Camera size={16} className="text-white" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleSeleccionarFoto}
                aria-label="Seleccionar foto de perfil"
              />
            </div>

            {/* Info del usuario */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold text-white">{perfil?.nombre_completo}</h2>
              <p className="text-white/60 text-sm mt-1">{perfil?.correo}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#B7950B]/20 text-[#B7950B] border border-[#B7950B]/30">
                  {perfil?.rol_codigo}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  perfil?.correo_verificado ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                }`}>
                  {perfil?.correo_verificado ? '✓ Verificado' : '⚠ Sin verificar'}
                </span>
              </div>

              {/* Botones de foto cuando hay preview pendiente */}
              <AnimatePresence>
                {fotoBase64 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="flex gap-2 mt-4 justify-center sm:justify-start"
                  >
                    <button
                      type="button"
                      onClick={handleGuardarFoto}
                      disabled={subiendoFoto}
                      className="flex items-center gap-2 px-4 py-2 bg-[#B7950B] text-white text-xs font-bold rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-60"
                    >
                      {subiendoFoto ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {subiendoFoto ? 'Guardando...' : 'Guardar foto'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelarFoto}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                    >
                      <X size={14} /> Cancelar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="sm:ml-auto text-center sm:text-right">
              <p className="text-white/40 text-xs uppercase tracking-wider">Miembro desde</p>
              <p className="text-white/80 text-sm font-medium mt-1">
                {new Date(perfil?.creado_en).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de datos personales */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#0D2137]/10 rounded-2xl flex items-center justify-center">
              <Edit3 size={20} className="text-[#0D2137]" />
            </div>
            <div>
              <h3 className="font-bold text-[#0D2137] text-lg">Información Personal</h3>
              <p className="text-slate-500 text-xs mt-0.5">Actualiza tu nombre y número de teléfono</p>
            </div>
          </div>

          <form onSubmit={handleGuardarPerfil} className="space-y-5">
            {/* Correo (solo lectura) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo electrónico</label>
              <div className="flex items-center gap-3 w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-500">
                <Mail size={18} className="text-slate-400" />
                <span className="text-sm truncate">{perfil?.correo}</span>
                <span className="ml-auto text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">No editable</span>
              </div>
            </div>

            <div>
              <label htmlFor="nombre_completo" className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre completo</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="nombre_completo"
                  type="text"
                  value={form.nombre_completo}
                  onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#B7950B] focus:outline-none focus:ring-2 focus:ring-[#B7950B]/20 transition-all text-slate-900 text-sm font-medium"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono / WhatsApp</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={e => setForm(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '') }))}
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#B7950B] focus:outline-none focus:ring-2 focus:ring-[#B7950B]/20 transition-all text-slate-900 text-sm font-medium"
                  placeholder="099 123 4567"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3.5 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
              <Shield size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-[#0D2137] text-lg">Cambiar Contraseña</h3>
              <p className="text-slate-500 text-xs mt-0.5">Por seguridad, ingresa tu contraseña actual primero</p>
            </div>
          </div>

          {claveError && (
            <div className="mb-5 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">{claveError}</p>
            </div>
          )}

          <form onSubmit={handleCambiarClave} className="space-y-4">
            {[['password_actual', 'Contraseña actual', 'actual'], ['password_nueva', 'Nueva contraseña', 'nueva'], ['confirmar', 'Confirmar nueva contraseña', 'confirmar']].map(([key, label, showKey]) => (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id={key}
                    type={showPass[showKey] ? 'text' : 'password'}
                    value={clave[key]}
                    onChange={e => { setClave(p => ({ ...p, [key]: e.target.value })); setClaveError(''); }}
                    className="w-full pl-11 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all text-slate-900 text-sm font-medium"
                    placeholder={label}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => ({ ...p, [showKey]: !p[showKey] }))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPass[showKey] ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPass[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <Lock size={18} />
              {guardando ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
