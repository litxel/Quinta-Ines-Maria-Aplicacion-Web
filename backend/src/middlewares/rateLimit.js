'use strict';
const { rateLimit } = require('express-rate-limit');

// =============================================================================
//  LÍMITES DE PETICIONES — EventPlanner QIM
//  Protegen el login contra fuerza bruta, la cuota gratuita de Gemini y el
//  envío de correos (300/día en Brevo) contra abusos.
// =============================================================================

const crear = (windowMs, limit, message, opciones = {}) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders:   false,
  message:         { success: false, message, code: 'RATE_LIMIT' },
  ...opciones,
});

const MIN = 60 * 1000;

module.exports = {
  // Todas las rutas /api (navegación normal queda muy por debajo)
  general: crear(15 * MIN, 600, 'Demasiadas peticiones. Espera unos minutos e intenta de nuevo.'),

  // Login, registro, recuperación y reenvío de verificación
  auth: crear(15 * MIN, 20, 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.'),

  // Acciones que envían correos (registro, recuperar clave, reenviar verificación, cotización)
  // (solo cuentan las peticiones exitosas: un error de tipeo no gasta el cupo)
  correo: crear(60 * MIN, 8, 'Has solicitado demasiados correos. Intenta de nuevo en una hora.', { skipFailedRequests: true }),

  // Asistente IA (Gemini gratis permite ~15 consultas por minuto en total)
  ia: crear(10 * MIN, 20, 'Has hecho muchas consultas al asistente. Espera unos minutos.'),

  // Crear solicitudes
  solicitud: crear(60 * MIN, 10, 'Has enviado demasiadas solicitudes. Intenta más tarde.'),
};
