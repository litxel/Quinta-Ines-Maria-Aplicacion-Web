import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verificarCuentaRequest } from '../services/auth.service';

export default function VerificarCuenta() {
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token') ?? '';

  const [estado, setEstado] = useState('cargando'); // cargando | exito | error
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!token) { setEstado('error'); setMensaje('Token no encontrado en el enlace.'); return; }

    verificarCuentaRequest(token)
      .then((data) => {
        setNombre(data.data?.nombre_completo ?? '');
        setEstado('exito');
      })
      .catch((err) => {
        setMensaje(err.response?.data?.message ?? 'El enlace es inválido o ya expiró.');
        setEstado('error');
      });
  }, [token]);

  return (
    <main className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="font-display text-3xl font-bold text-[#0D2137]">Quinta Inés María</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">BED · Catering · Eventos</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#0D2137] via-[#1A6BAC] to-[#B7950B]" />

          <div className="p-10 text-center">

            {/* Cargando */}
            {estado === 'cargando' && (
              <>
                <div className="w-14 h-14 border-4 border-[#0D2137] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                <h2 className="font-display text-xl font-bold text-[#0D2137]">Verificando tu cuenta…</h2>
                <p className="text-slate-400 text-sm mt-2">Espera un momento.</p>
              </>
            )}

            {/* Éxito */}
            {estado === 'exito' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#0D2137] mb-3">
                  ¡Cuenta verificada!
                </h2>
                <p className="text-slate-500 leading-relaxed mb-6">
                  {nombre ? `Bienvenida/o, ${nombre}. ` : ''}
                  Tu correo ha sido confirmado. Ya puedes iniciar sesión y planificar tu evento.
                </p>
                <Link
                  to="/login"
                  className="inline-block px-8 py-3 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] transition-colors text-sm"
                >
                  Iniciar sesión →
                </Link>
              </>
            )}

            {/* Error */}
            {estado === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="text-4xl">❌</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#0D2137] mb-3">
                  Enlace no válido
                </h2>
                <p className="text-slate-500 leading-relaxed mb-6">{mensaje}</p>
                <p className="text-sm text-slate-400 mb-6">
                  Si tu enlace expiró, inicia sesión y solicita un nuevo correo de verificación.
                </p>
                <Link
                  to="/login"
                  className="inline-block px-8 py-3 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] transition-colors text-sm"
                >
                  Ir a Iniciar sesión
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
