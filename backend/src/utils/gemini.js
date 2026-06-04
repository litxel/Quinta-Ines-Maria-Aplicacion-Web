'use strict';
require('dotenv').config();

// =============================================================================
//  UTILIDAD GEMINI — EventPlanner QIM
//  SDK oficial: @google/generative-ai
//  Instalación: npm install @google/generative-ai
//
//  Variables .env requeridas:
//    GEMINI_API_KEY=tu_api_key
//    GEMINI_MODEL=gemini-2.5-flash
// =============================================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Inicializar el cliente una sola vez (singleton) ──────────────────────────
let genAI  = null;
let modelo = null;

const inicializarGemini = () => {
  if (modelo) return modelo;  // ya inicializado

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY no definida — el asistente IA estará en modo fallback.');
    return null;
  }

  genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  modelo = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
  });

  console.log(`✅  Gemini inicializado: ${process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'}`);
  return modelo;
};

// =============================================================================
//  SYSTEM PROMPT — Contexto estricto del asistente
//  Este prompt define la identidad, el catálogo y las restricciones del modelo.
// =============================================================================

const YEAR_ACTUAL = new Date().getFullYear();
const MES_ACTUAL  = new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });

const SYSTEM_PROMPT = `
Eres el Asistente Experto de Eventos de la "Quinta Inés María BED, Catering y Eventos",
un exclusivo centro de eventos ubicado en el Cantón Chambo, Chimborazo, Ecuador.

Tu misión es ayudar a los clientes a elegir el mejor paquete y configuración para su evento.

FECHA DE HOY: ${new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
AÑO EN CURSO: ${YEAR_ACTUAL}

═══════════════════════════════════════════════════════
  CATÁLOGO OFICIAL — QUINTA INÉS MARÍA (${YEAR_ACTUAL})
═══════════════════════════════════════════════════════
• PAQUETE BRONCE (Código: BRONCE) — $15.00/persona
• PAQUETE SILVER (Código: SILVER) — $22.00/persona
• PAQUETE GOLD (Código: GOLD) — $35.00/persona
• PROMO CORPORATIVA (Código: CORPORATIVO) — $28.00/persona
• ALFOMBRA ROJA (Código: VIP-01) — $55.00/persona
(Todos requieren un mínimo de 100 personas).

═══════════════════════════════════════════════════════
  ⚠️ REGLAS DE NEGOCIO OBLIGATORIAS
═══════════════════════════════════════════════════════
1. MÍNIMO DE PERSONAS: Solo se realizan eventos con MÍNIMO 100 invitados.
   Si el cliente dice que quiere menos de 100 personas, responde de forma amable:
   "Lo siento, en la Quinta Inés María solo organizamos eventos a partir de 100 personas. ¿Podrías confirmarnos si el número de invitados sería de 100 o más?"

2. PRESUPUESTO MÍNIMO: El paquete más económico es el Bronce a $15.00/persona.
   Si el cliente menciona un presupuesto total muy bajo (ej: $100 para todo), 
   explícale que el costo mínimo es $15.00/persona × 100 personas = $1,500.00.

3. FECHAS: Las fechas deben ser en el año ${YEAR_ACTUAL} o ${YEAR_ACTUAL + 1}, NUNCA en el pasado.
   La fecha de hoy es ${new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}.
   Si el cliente menciona una fecha pasada, dile que seleccione una fecha futura.
   SIEMPRE convierte la fecha al formato YYYY-MM-DD. Si el cliente no especifica el año,
   usa ${YEAR_ACTUAL} si la fecha es futura, o ${YEAR_ACTUAL + 1} si ya pasó en ${YEAR_ACTUAL}.

═══════════════════════════════════════════════════════
  🚀 MAGIA DE VENTAS (PROCESO ESTRICTO DE 2 PASOS)
═══════════════════════════════════════════════════════
Para poder generar una cotización real, DEBES seguir ESTRICTAMENTE este orden:

PASO 1: RECOPILAR DATOS Y RECOMENDAR (SIN ENVIAR ENLACES AÚN)
Debes averiguar: 1) Tipo de evento, 2) Fecha exacta, 3) Número de invitados.
Valida que los invitados sean >= 100 antes de continuar.
Una vez que tengas esos 3 datos válidos, analízalos y RECOMIENDA 1 o 2 paquetes.
AL FINAL DEBES PREGUNTAR: "¿Cuál de estos paquetes te gustaría elegir para tu evento?"
(¡PROHIBIDO ENVIAR EL ENLACE EN ESTE PASO!)

PASO 2: EL CLIENTE ELIGE Y TÚ ENVÍAS EL ENLACE
SOLO CUANDO el cliente responda explícitamente qué paquete elige,
generarás el "Enlace Inteligente" en formato Markdown estricto:

[¡Haz clic aquí para continuar armando tu paquete NOMBRE_PAQUETE!](/configurador?evento=TIPO_DE_EVENTO&paquete=CODIGO_DEL_PAQUETE&invitados=NUMERO_DE_PERSONAS&fecha=YYYY-MM-DD)

✅ REGLAS DE ORO:
- NUNCA envíes el enlace sin que el cliente haya elegido el paquete primero.
- NUNCA envíes el enlace si falta la fecha, el tipo de evento o los invitados.
- La fecha en el enlace SIEMPRE debe ser en el año ${YEAR_ACTUAL} o ${YEAR_ACTUAL + 1}, formato YYYY-MM-DD.
- El texto del enlace debe ser SIMPLE, sin emojis ni caracteres especiales: solo letras, espacios y el nombre del paquete.

`.trim();

// =============================================================================
//  FUNCIÓN PRINCIPAL — consultarAsistente
// =============================================================================
/**
 * Envía una consulta a Gemini con el system prompt del asistente QIM.
 *
 * @param {string} mensajeUsuario  - Pregunta o mensaje del cliente
 * @param {Array}  historial       - [{ role: 'user'|'model', parts: [{ text }] }]
 *                                   Permite conversaciones de múltiples turnos.
 * @returns {{ texto: string, exito: boolean, fallback: boolean }}
 */
const consultarAsistente = async (mensajeUsuario, historial = []) => {

  // ── Modo fallback si Gemini no está configurado ───────────────────────────
  const modeloIA = inicializarGemini();
  if (!modeloIA) {
    return {
      texto:    mensajeFallback(),
      exito:    false,
      fallback: true,
    };
  }
  // ── Llamada a la API con historial ────────────────────────────────────────
  try {
    // Construir el historial de chat. El system prompt va como primer mensaje
    // del modelo para establecer el contexto (patrón recomendado con Gemini).
    const historialConContexto = [
      // Turno inicial: el modelo "recibe" el contexto como su primer output
      {
        role:  'user',
        parts: [{ text: 'Define tu rol y catálogo para este chat.' }],
      },
      {
        role:  'model',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      // Historial de conversación previo
      ...historial,
    ];
    const chat = modeloIA.startChat({
      history:          historialConContexto,
      generationConfig: {
        maxOutputTokens: 800,    // respuestas concisas
        temperature:     0.7,    // balance entre creatividad y precisión
        topP:            0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });
    const resultado = await chat.sendMessage(mensajeUsuario);
    const texto     = resultado.response.text();

    if (!texto || texto.trim().length === 0) {
      throw new Error('Respuesta vacía de Gemini.');
    }

    return { texto: texto.trim(), exito: true, fallback: false };

  } catch (err) {
    // ── Clasificar el tipo de error para logs más útiles ─────────────────
    const esLimiteQuota  = err.message?.includes('429') || err.message?.includes('quota');
    const esRedError     = err.message?.includes('ENOTFOUND') || err.message?.includes('ETIMEDOUT');
    const esModeracion   = err.message?.includes('SAFETY') || err.message?.includes('blocked');

    if (esLimiteQuota) console.warn('⚠️  Gemini: límite de cuota alcanzado.');
    if (esRedError)    console.warn('⚠️  Gemini: error de red —', err.message);
    if (esModeracion)  console.warn('⚠️  Gemini: contenido bloqueado por moderación.');
    if (!esLimiteQuota && !esRedError && !esModeracion)
      console.error('❌  Gemini error inesperado:', err.message);

    return {
      texto:    esModeracion ? mensajeMoaderacion() : mensajeFallback(),
      exito:    false,
      fallback: true,
    };
  }
};

// ── Mensajes de fallback amigables ────────────────────────────────────────────
const mensajeFallback = () =>
  `✨ Nuestro asistente de IA está descansando en este momento, pero ¡no te preocupes!\n\n` +
  `Puedes configurar tu evento manualmente usando nuestro configurador paso a paso.\n\n` +
  `**Resumen rápido del catálogo:**\n` +
  `• 🥉 Paquete Bronce: $15/persona (mín. 100)\n` +
  `• 🥈 Paquete Silver: $22/persona\n` +
  `• 🥇 Paquete Gold: $35/persona\n` +
  `• 💼 Promo Corporativa: $28/persona\n` +
  `• ⭐ Alfombra Roja: $55/persona\n\n` +
  `¿Necesitas ayuda adicional? Contáctanos directamente. 😊`;

const mensajeMoaderacion = () =>
  `Hmm, parece que tu mensaje contiene contenido que no puedo procesar. ` +
  `Por favor, intenta reformular tu consulta sobre el evento que deseas planificar en la Quinta Inés María. 😊`;

module.exports = { consultarAsistente };