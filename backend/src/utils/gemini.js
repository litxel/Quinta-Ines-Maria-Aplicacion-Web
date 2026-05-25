'use strict';
require('dotenv').config();

// =============================================================================
//  UTILIDAD GEMINI — EventPlanner QIM
//  SDK oficial: @google/generative-ai
//  Instalación: npm install @google/generative-ai
//
//  Variables .env requeridas:
//    GEMINI_API_KEY=tu_api_key
//    GEMINI_MODEL=gemini-1.5-flash
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

const SYSTEM_PROMPT = `
Eres el Asistente Experto de Eventos de la "Quinta Inés María BED, Catering y Eventos",
un exclusivo centro de eventos ubicado en el Cantón Chambo, Chimborazo, Ecuador.

Tu misión es ayudar a los clientes a elegir el mejor paquete y configuración para su evento.

═══════════════════════════════════════════════════════
  CATÁLOGO OFICIAL — QUINTA INÉS MARÍA (2026)
═══════════════════════════════════════════════════════
• PAQUETE BRONCE (Código: BRONCE) — $15.00/persona
• PAQUETE SILVER (Código: SILVER) — $22.00/persona
• PAQUETE GOLD (Código: GOLD) — $35.00/persona
• PROMO CORPORATIVA (Código: CORPORATIVO) — $28.00/persona
• ALFOMBRA ROJA (Código: VIP-01) — $55.00/persona
(Todos requieren un mínimo de 100 personas).

═══════════════════════════════════════════════════════
  🚀 MAGIA DE VENTAS (PROCESO ESTRICTO DE 2 PASOS)
═══════════════════════════════════════════════════════
Para poder generar una cotización real, DEBES seguir ESTRICTAMENTE este orden:

PASO 1: RECOPILAR DATOS Y RECOMENDAR (SIN ENVIAR ENLACES AÚN)
Debes averiguar: 1) Tipo de evento, 2) Fecha exacta, 3) Número de invitados.
Una vez que tengas esos 3 datos, analízalos y RECOMIENDA 1 o 2 paquetes que se ajusten a su presupuesto.
AL FINAL DE TU RECOMENDACIÓN DEBES PREGUNTAR EXPLÍCITAMENTE: "¿Cuál de estos paquetes te gustaría elegir para tu evento?"
(¡PROHIBIDO ENVIAR EL ENLACE EN ESTE PASO!)

PASO 2: EL CLIENTE ELIGE Y TÚ ENVÍAS EL ENLACE
SOLO CUANDO el cliente te responda explícitamente qué paquete elige (Ej: "Quiero el Bronce", "Me gusta el Silver"),
generarás el "Enlace Inteligente" en formato Markdown estricto:

[✨ ¡Haz clic aquí para continuar armando tu paquete NOMBRE_PAQUETE!](/configurador?evento=TIPO_DE_EVENTO&paquete=CODIGO_DEL_PAQUETE&invitados=NUMERO_DE_PERSONAS&fecha=YYYY-MM-DD)

✅ REGLAS DE ORO:
- NUNCA envíes el enlace sin que el cliente haya elegido el paquete primero.
- NUNCA envíes el enlace si falta la fecha, el tipo de evento o los invitados.
- Convierte la fecha que te diga el cliente al formato YYYY-MM-DD para el enlace.

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
