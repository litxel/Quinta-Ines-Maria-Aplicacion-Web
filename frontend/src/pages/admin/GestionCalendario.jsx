import { useState, useEffect } from 'react';
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

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Cargando disponibilidad...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0D2137] font-display">Calendario de Disponibilidad</h1>
        <p className="text-sm text-slate-500 mt-1">Bloquea fechas por mantenimiento o revisa los eventos agendados.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        
        {/* Cabecera del Calendario */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={irMesAnterior} className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold">← Anterior</button>
          <h2 className="text-xl font-bold text-[#0D2137] capitalize">
            {mesActual.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={irMesSiguiente} className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold">Siguiente →</button>
        </div>

        {/* Nombres de los Días */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase">
          <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
        </div>

        {/* Cuadrícula del Calendario */}
        <div className="grid grid-cols-7 gap-2">
          {celdasVacias.map(i => <div key={`empty-${i}`} className="p-4 bg-slate-50/50 rounded-xl" />)}
          
          {diasArray.map((info) => {
            const esHoy = info.fecha === new Date().toISOString().split('T')[0];
            
            return (
              <div 
                key={info.dia} 
                className={`relative p-2 h-28 border rounded-xl flex flex-col transition-all 
                  ${esHoy ? 'ring-2 ring-[#0D2137]' : 'border-slate-100'}
                  ${!info.evento && !info.bloqueo ? 'hover:border-[#B7950B] cursor-pointer hover:shadow-md group' : 'bg-slate-50'}
                `}
                onClick={() => {
                  if (!info.evento && !info.bloqueo) {
                    setFechaSeleccionada(info.fecha);
                    setModalAbierto(true);
                  }
                }}
              >
                <span className={`font-bold text-sm mb-1 ${esHoy ? 'text-[#0D2137]' : 'text-slate-700'}`}>{info.dia}</span>
                
                {info.evento && (
                  <div className="bg-[#0D2137] text-white text-[10px] p-1.5 rounded-lg leading-tight shadow-sm">
                    <p className="font-bold truncate">{info.evento.cliente}</p>
                    <p className="text-[#B7950B]">{info.evento.paquete_nombre}</p>
                  </div>
                )}

                {info.bloqueo && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-[10px] p-1.5 rounded-lg leading-tight flex-1 flex flex-col justify-between">
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
        <div className="fixed inset-0 bg-[#0D2137]/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-[#0D2137] mb-2 font-display">Bloquear Fecha</h2>
            <p className="text-sm text-slate-500 mb-6">Bloqueando el: <strong className="text-[#0D2137]">{fechaSeleccionada}</strong></p>
            
            <form onSubmit={handleBloquear} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Motivo (Nota Interna)</label>
                <input 
                  type="text" 
                  required 
                  maxLength={50}
                  value={nota} 
                  onChange={(e) => setNota(e.target.value)} 
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" 
                  placeholder="Ej: Mantenimiento, Feriado, Cerrado..." 
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-3 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">Cancelar</button>
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