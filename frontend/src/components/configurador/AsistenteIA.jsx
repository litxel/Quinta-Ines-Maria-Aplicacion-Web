import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

// =============================================================================
//  COMPONENTE — AsistenteIA
//  Asistente de sugerencias con IA para el Configurador de Eventos QIM
//
//  Props:
//    paqueteActual  {object|null}  — paquete seleccionado en el store
//    numInvitados   {number}       — invitados actuales
//    onSugerencia   {function}     — callback cuando la IA sugiere un paquete
//                                   recibe: { paquete_codigo, num_invitados }
//
//  Funciona de forma completamente independiente de jsPDF y Nodemailer.
//  Se puede integrar en Configurador.jsx o usarse como panel flotante.
// =============================================================================

// ── Sugerencias rápidas ───────────────────────────────────────────────────────
const SUGERENCIAS_RAPIDAS = [
  'Tengo $2000 y 120 invitados, ¿qué paquete me conviene?',
  '¿Cuál es la diferencia entre el paquete Silver y Gold?',
  '¿Qué servicios incluye el paquete corporativo?',
  'Quiero hacer una quinceañera para 150 personas, ¿cuánto me costaría?',
  '¿Qué extras me recomiendan para una boda íntima?',
];

// ── Parsear Markdown básico a JSX ─────────────────────────────────────────────
// Convierte **negrita**, • listas y saltos de línea en elementos React.
// ── Parsear Markdown básico a JSX ─────────────────────────────────────────────
const renderMarkdown = (texto) => {
  if (!texto) return null;

  return texto.split('\n').map((linea, i) => {
    if (linea.trim() === '') return <div key={i} className="h-2" />;

    // 🚀 MAGIA: Dividir buscando negritas O enlaces en formato Markdown [Texto](url)
    const partes = linea.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).map((parte, j) => {
      // Si es negrita
      if (parte.startsWith('**') && parte.endsWith('**')) {
        return (
          <strong key={j} className="font-semibold text-[#0D2137]">
            {parte.slice(2, -2)}
          </strong>
        );
      }
      // 🚀 Si es un ENLACE INTELIGENTE
      if (parte.startsWith('[') && parte.endsWith(')')) {
        const textMatch = parte.match(/\[([^\]]+)\]/);
        const urlMatch = parte.match(/\(([^)]+)\)/);
        if (textMatch && urlMatch) {
          return (
            <a
              key={j}
              href={urlMatch[1]}
              className="inline-block mt-2 px-4 py-2 bg-[#B7950B] text-white rounded-lg font-bold hover:bg-[#9A7D0A] transition-all shadow-md"
            >
              🚀 {textMatch[1]}
            </a>
          );
        }
      }
      return parte;
    });

    const esLista = /^[\s]*[•\-\*]/.test(linea);
    if (esLista) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm leading-relaxed mt-1">
          <span className="text-[#B7950B] font-bold mt-0.5 shrink-0">•</span>
          <span>{partes}</span>
        </div>
      );
    }

    if (/^[-=]{3,}$/.test(linea.trim())) {
      return <hr key={i} className="border-slate-200 my-2" />;
    }

    return (
      <p key={i} className="text-sm leading-relaxed mt-1">
        {partes}
      </p>
    );
  });
};

// =============================================================================
//  COMPONENTE PRINCIPAL
// =============================================================================
export default function AsistenteIA({ paqueteActual = null, numInvitados = 100, onSugerencia }) {
  const [mensajes,   setMensajes]   = useState([]);  // { role, texto, fallback? }
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [abierto,    setAbierto]    = useState(false);
  const [errorConex, setErrorConex] = useState(false);

  const contenedorRef = useRef(null);
  const inputRef      = useRef(null);

  // Scroll automático al último mensaje
  useEffect(() => {
    if (contenedorRef.current) {
      contenedorRef.current.scrollTop = contenedorRef.current.scrollHeight;
    }
  }, [mensajes, loading]);

  // Focus en el input al abrir
  useEffect(() => {
    if (abierto && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [abierto]);

  // ── Enviar consulta ─────────────────────────────────────────────────────────
  const enviarMensaje = async (textoOverride = null) => {
    const texto = (textoOverride ?? input).trim();
    if (!texto || loading) return;

    // Agregar el mensaje del usuario al chat
    const nuevoMensajeUsuario = { role: 'user', texto };
    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setInput('');
    setLoading(true);
    setErrorConex(false);

    // Construir el historial en el formato que espera Gemini
    const historialParaAPI = mensajes.map((m) => ({
      role:  m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.texto }],
    }));

    // Enriquecer el mensaje con contexto del configurador actual
    let mensajeEnriquecido = texto;
    if (paqueteActual || numInvitados > 100) {
      const contexto = [];
      if (paqueteActual)    contexto.push(`el paquete ${paqueteActual.paquete_nombre} a $${paqueteActual.precio_persona}/persona`);
      if (numInvitados > 0) contexto.push(`${numInvitados} invitados`);
      if (contexto.length > 0) {
        mensajeEnriquecido = `${texto}\n[Contexto actual: ${contexto.join(', ')}]`;
      }
    }

    try {
      const { data } = await api.post('/configurador/recomendar', {
        mensaje:   mensajeEnriquecido,
        historial: historialParaAPI,
      });

      const respIA = data.data;
      setMensajes((prev) => [
        ...prev,
        {
          role:     'assistant',
          texto:    respIA.texto,
          fallback: respIA.fallback,
        },
      ]);
    } catch (err) {
      // Error de red (el backend falló completamente)
      setErrorConex(true);
      setMensajes((prev) => [
        ...prev,
        {
          role:     'assistant',
          texto:    '⚠️ No pude conectarme en este momento. Verifica tu conexión e intenta de nuevo.',
          fallback: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const limpiarChat = () => setMensajes([]);

  // ═══════════════════════════════════════════════════════════════
  //  BOTÓN FLOTANTE (cuando el panel está cerrado)
  // ═══════════════════════════════════════════════════════════════
  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#0D2137] text-white rounded-full shadow-2xl hover:bg-[#1A6BAC] transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#B7950B] focus:ring-offset-2 group"
        aria-label="Abrir asistente de IA"
      >
        <span className="text-xl group-hover:animate-spin-slow">✨</span>
        <span className="font-semibold text-sm hidden sm:block">Asistente IA</span>
        {/* Indicador de disponible */}
        <span className="w-2 h-2 bg-[#B7950B] rounded-full animate-pulse" aria-hidden="true" />
      </button>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  PANEL DEL CHAT
  // ═══════════════════════════════════════════════════════════════
  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[420px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 80px)', height: '560px' }}
      role="dialog"
      aria-label="Asistente de Eventos con IA"
      aria-modal="false"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0D2137] px-4 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#B7950B] flex items-center justify-center text-lg">
              ✨
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0D2137]"
              aria-label="Asistente en línea"
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Asistente QIM</p>
            <p className="text-white/50 text-xs">Experto en eventos · Quinta Inés María</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mensajes.length > 0 && (
            <button
              onClick={limpiarChat}
              className="text-white/40 hover:text-white/70 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/10"
              aria-label="Limpiar conversación"
              title="Limpiar chat"
            >
              🗑
            </button>
          )}
          <button
            onClick={() => setAbierto(false)}
            className="text-white/50 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Cerrar asistente"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Banda dorada */}
      <div className="h-0.5 bg-gradient-to-r from-[#0D2137] via-[#B7950B] to-[#0D2137] shrink-0" />

      {/* ── Área de mensajes ────────────────────────────────────────────── */}
      <div
        ref={contenedorRef}
        className="flex-1 overflow-y-auto bg-[#F5F0E8] p-4 space-y-4"
        aria-live="polite"
        aria-label="Conversación con el asistente"
      >

        {/* Bienvenida si no hay mensajes */}
        {mensajes.length === 0 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto mb-3 bg-[#0D2137] rounded-full flex items-center justify-center text-2xl shadow-lg">
              ✨
            </div>
            <p className="font-bold text-[#0D2137] text-sm mb-1">
              ¡Hola! Soy el Asistente de la Quinta Inés María
            </p>
            <p className="text-slate-500 text-xs leading-relaxed mb-5 px-2">
              Cuéntame sobre tu evento y te ayudaré a elegir el paquete perfecto.
            </p>

            {/* Sugerencias rápidas */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                Preguntas frecuentes
              </p>
              {SUGERENCIAS_RAPIDAS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => enviarMensaje(s)}
                  disabled={loading}
                  className="w-full text-left text-xs px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 hover:border-[#B7950B] hover:text-[#0D2137] transition-all duration-200 hover:shadow-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#B7950B]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {mensajes.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar del asistente */}
            {msg.role !== 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#0D2137] flex items-center justify-center text-sm shrink-0 mr-2 mt-1 shadow">
                ✨
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#0D2137] text-white rounded-br-sm'
                  : msg.fallback
                  ? 'bg-amber-50 border border-amber-200 rounded-bl-sm'
                  : 'bg-white border border-slate-100 rounded-bl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed">{msg.texto}</p>
              ) : (
                <div className="space-y-1.5 text-slate-700">
                  {msg.fallback && (
                    <p className="text-xs font-medium text-amber-600 mb-2 flex items-center gap-1">
                      <span>⚠</span> Modo sin conexión
                    </p>
                  )}
                  {renderMarkdown(msg.texto)}
                </div>
              )}
            </div>

            {/* Avatar del usuario */}
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#B7950B] flex items-center justify-center text-sm shrink-0 ml-2 mt-1 shadow">
                👤
              </div>
            )}
          </div>
        ))}

        {/* Indicador de carga */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#0D2137] flex items-center justify-center text-sm shrink-0 mr-2 mt-1 shadow">
              ✨
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm max-w-[82%]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className="w-2 h-2 bg-[#B7950B] rounded-full animate-bounce"
                      style={{ animationDelay: `${n * 0.15}s` }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400 italic">Analizando opciones…</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Área de input ───────────────────────────────────────────────── */}
      <div className="bg-white border-t border-slate-100 p-3 shrink-0">
        {/* Contexto del configurador actual (si hay uno) */}
        {paqueteActual && (
          <div className="flex items-center gap-2 bg-[#0D2137]/5 rounded-lg px-3 py-1.5 mb-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: paqueteActual.color_principal ?? '#0D2137' }}
              aria-hidden="true"
            />
            <p className="text-xs text-slate-500 truncate">
              Configurando: <strong className="text-[#0D2137]">{paqueteActual.paquete_nombre}</strong>
              {' · '}{numInvitados} personas
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Tengo $2000 y 120 invitados…"
            disabled={loading}
            rows={1}
            maxLength={500}
            className="flex-1 resize-none px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1A6BAC] focus:ring-2 focus:ring-[#1A6BAC]/20 disabled:opacity-50 disabled:bg-slate-50 transition-colors"
            aria-label="Escribe tu consulta al asistente"
            style={{ minHeight: '44px', maxHeight: '100px' }}
            onInput={(e) => {
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          <button
            onClick={() => enviarMensaje()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-[#0D2137] text-white flex items-center justify-center hover:bg-[#B7950B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] focus:ring-offset-1 shrink-0"
            aria-label="Enviar mensaje"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>

        {/* Contador de caracteres */}
        {input.length > 400 && (
          <p className="text-right text-xs text-slate-400 mt-1">
            {input.length}/500
          </p>
        )}

        <p className="text-center text-[10px] text-slate-300 mt-2">
          IA basada en el catálogo oficial · Precios referenciales
        </p>
      </div>
    </div>
  );
}
