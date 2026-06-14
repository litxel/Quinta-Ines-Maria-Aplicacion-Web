import { useState, useEffect } from 'react';
import { Calendar, Lock, PartyPopper, Info, X } from 'lucide-react';
import api from '../../services/api';

export default function GestionCalendario() {
  const [eventos, setEventos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Navegación del mes
  const [mesActual, setMesActual] = useState(new Date());
  const [ayudaVisible, setAyudaVisible] = useState(true);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/configurador/admin/calendario');
      setEventos(data.data.eventos || []);
      setBloqueos(data.data.bloqueos || []);
    } catch (error) {
      console.error('Error al cargar calendario', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleBloquear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/configurador/admin/calendario', { 
        fecha: fechaSeleccionada, 
        nota_interna: nota 
      });
      setModalAbierto(false);
      setNota('');
      cargarDatos(); // Recarga y pinta el cuadrito de ROJO
    } catch (error) {
      console.error("Error completo:", error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setGuardando(false);
    }
  };

  const handleDesbloquear = async (id) => {
    if(!window.confirm('¿Seguro que deseas habilitar esta fecha nuevamente?')) return;
    try {
      await api.delete(`/configurador/admin/calendario/${id}`);
      cargarDatos(); // Recarga y pinta el cuadrito de BLANCO
    } catch (error) {
      alert('Error al desbloquear: ' + (error.response?.data?.message || error.message));
    }
  };

  // ── LÓGICA DEL CALENDARIO HTML5 (Sin librerías) ──
  const irMesAnterior = () => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));
  const irMesSiguiente = () => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));

  const diasEnMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate();
  const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay();
  
  // Ajuste para que la semana empiece en Lunes (0=Lunes, 6=Domingo)
  const primerDiaAjustado = primerDiaMes === 0 ? 6 : primerDiaMes - 1;

  const diasArray = Array.from({ length: diasEnMes }, (_, i) => {
    const d = new Date(mesActual.getFullYear(), mesActual.getMonth(), i + 1);
    const fechaString = d.toISOString().split('T')[0];
    
    // Buscar si hay eventos o bloqueos ese día
    const ev = eventos.find(e => new Date(e.fecha).toISOString().split('T')[0] === fechaString);
    const bl = bloqueos.find(b => new Date(b.fecha).toISOString().split('T')[0] === fechaString);
    
    return { dia: i + 1, fecha: fechaString, evento: ev, bloqueo: bl };
  });

  const celdasVacias = Array.from({ length: primerDiaAjustado }, (_, i) => i);

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400 font-medium animate-pulse">Cargando disponibilidad...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0D2137] dark:text-white font-display flex items-center gap-3">
          <Calendar className="text-[#B7950B]" size={32} />
          Calendario de Disponibilidad
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bloquea fechas o consulta eventos confirmados en la quinta.</p>
      </div>

      {ayudaVisible && (
        <div className="relative p-5 pr-12 bg-gradient-to-r from-[#0D2137]/5 to-[#B7950B]/10 dark:from-[#A971D6]/12 dark:to-[#C9A227]/10 border border-[#B7950B]/25 dark:border-[#C9A227]/25 rounded-2xl">
          <button
            type="button"
            onClick={() => setAyudaVisible(false)}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-lg hover:bg-white/80"
            aria-label="Cerrar ayuda"
          >
            <X size={18} />
          </button>
          <div className="flex gap-3">
            <Info size={22} className="text-[#B7950B] shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700 dark:text-slate-200 space-y-2">
              <p className="font-bold text-[#0D2137] dark:text-white">¿Cómo usar este calendario?</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li><strong className="text-[#0D2137] dark:text-white">Celdas vacías:</strong> haz clic para bloquear la fecha (mantenimiento, feriado, etc.).</li>
                <li><strong className="text-[#0D2137] dark:text-white">Azul oscuro:</strong> evento agendado con cliente — no se puede bloquear desde aquí.</li>
                <li><strong className="text-red-600">Rojo:</strong> fecha bloqueada manualmente; usa &quot;Desbloquear&quot; para habilitarla.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#332247] border border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-300">
          <span className="w-4 h-4 rounded border-2 border-slate-200 dark:border-white/15 bg-white dark:bg-white/15" /> Disponible
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0D2137]/10 dark:bg-[#A971D6]/18 text-[#0D2137] dark:text-[#C9A227]">
          <PartyPopper size={14} /> Evento agendado
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-500/25">
          <Lock size={14} /> Bloqueado
        </span>
      </div>

      <div className="bg-white dark:bg-[#332247] rounded-2xl shadow-sm border border-slate-100 dark:border-white/8 p-6 md:p-8">
        
        {/* Cabecera del Calendario */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={irMesAnterior} className="px-4 py-2 border border-slate-200 dark:border-white/12 rounded-lg hover:bg-slate-50 dark:hover:bg-white/8 text-[#0D2137] dark:text-slate-200 font-bold transition-colors">← Anterior</button>
          <h2 className="text-xl font-bold text-[#0D2137] dark:text-white capitalize">
            {mesActual.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={irMesSiguiente} className="px-4 py-2 border border-slate-200 dark:border-white/12 rounded-lg hover:bg-slate-50 dark:hover:bg-white/8 text-[#0D2137] dark:text-slate-200 font-bold transition-colors">Siguiente →</button>
        </div>

        {/* Nombres de los Días */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-[#0D2137] dark:text-white/60 uppercase tracking-widest">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <div key={d} className="py-2 bg-slate-50 dark:bg-white/5 rounded-lg">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {celdasVacias.map(i => <div key={`empty-${i}`} className="min-h-[7rem] bg-slate-50/80 dark:bg-white/[0.02] rounded-xl" />)}
          
          {diasArray.map((info) => {
            const esHoy = info.fecha === new Date().toISOString().split('T')[0];
            const libre = !info.evento && !info.bloqueo;
            
            return (
              <div 
                key={info.dia} 
                title={libre ? 'Clic para bloquear esta fecha' : info.evento ? `Evento: ${info.evento.cliente}` : 'Fecha bloqueada'}
                className={`relative p-2 min-h-[7rem] border-2 rounded-xl flex flex-col transition-all 
                  ${esHoy ? 'ring-2 ring-[#B7950B] ring-offset-1' : ''}
                  ${libre ? 'border-slate-100 dark:border-white/8 bg-white dark:bg-white/[0.03] hover:border-[#B7950B] dark:hover:border-[#C9A227] cursor-pointer hover:shadow-lg group' : info.bloqueo ? 'border-red-200 dark:border-red-500/35 bg-red-50/60 dark:bg-red-500/15' : 'border-[#0D2137]/20 dark:border-[#A971D6]/30 bg-[#0D2137]/5 dark:bg-[#A971D6]/12'}
                `}
                onClick={() => {
                  if (!info.evento && !info.bloqueo) {
                    setFechaSeleccionada(info.fecha);
                    setModalAbierto(true);
                  }
                }}
              >
                <span className={`font-bold text-sm mb-1 ${esHoy ? 'text-[#0D2137] dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{info.dia}</span>
                
                {info.evento && (
                  <div className="bg-[#0D2137] dark:bg-gradient-to-br dark:from-[#6B3F7A] dark:to-[#A971D6] text-white text-[10px] p-1.5 rounded-lg leading-tight shadow-sm">
                    <p className="font-bold truncate">{info.evento.cliente}</p>
                    <p className="text-[#B7950B] dark:text-[#E8C84A]">{info.evento.paquete_nombre}</p>
                  </div>
                )}

                {info.bloqueo && (
                  <div className="bg-red-50 dark:bg-red-500/15 border border-red-100 dark:border-red-500/25 text-red-700 dark:text-red-300 text-[10px] p-1.5 rounded-lg leading-tight flex-1 flex flex-col justify-between">
                    <p className="font-bold">Bloqueado</p>
                    <p className="truncate opacity-70 mb-1">{info.bloqueo.nota_interna}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDesbloquear(info.bloqueo.disponibilidad_id); }}
                      className="text-red-500 hover:text-red-800 underline text-[9px] text-right"
                    >
                      Desbloquear
                    </button>
                  </div>
                )}

                {!info.evento && !info.bloqueo && (
                  <div className="hidden group-hover:flex flex-1 items-center justify-center text-[10px] text-[#B7950B] font-bold">
                    + Bloquear
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Bloqueo */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-[#221634]/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-[#332247] border border-transparent dark:border-white/8 rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-[#0D2137] dark:text-white mb-2 font-display">Bloquear Fecha</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Bloqueando el: <strong className="text-[#0D2137] dark:text-white">{fechaSeleccionada}</strong></p>
            
            <form onSubmit={handleBloquear} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Motivo (Nota Interna)</label>
                <input 
                  type="text" 
                  required 
                  maxLength={50}
                  value={nota} 
                  onChange={(e) => setNota(e.target.value)} 
                  className="w-full border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]"
                  placeholder="Ej: Mantenimiento, Feriado, Cerrado..." 
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-3 text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/14 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-md transition-all">
                  {guardando ? 'Bloqueando...' : 'Bloquear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}