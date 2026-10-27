'use strict';
const nodemailer = require('nodemailer');

// =============================================================================
//  SERVICIO DE EMAIL — EventPlanner QIM
//
//  PRODUCCIÓN: API HTTP de Brevo (BREVO_API_KEY). Render gratis bloquea los
//  puertos SMTP (25/465/587), así que el envío tiene que ir por HTTPS.
//  LOCAL: si no hay BREVO_API_KEY se usa SMTP con las variables SMTP_*.
//
//  Variables:
//    BREVO_API_KEY, MAIL_FROM_EMAIL (remitente verificado en Brevo), MAIL_FROM_NAME
//    SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS  (solo desarrollo)
// =============================================================================

const remitente = () => ({
  nombre: process.env.MAIL_FROM_NAME  || 'Quinta Inés María',
  correo: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER,
});

// ── Transporte SMTP (solo desarrollo local) ───────────────────────────────────
let transporter;
const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',  // true para 465, false para 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

/**
 * Envío genérico.
 * @param {{ para:string, nombre?:string, asunto:string, html:string,
 *           adjuntos?: Array<{ nombre:string, base64:string }> }} param
 */
const enviarCorreo = async ({ para, nombre, asunto, html, adjuntos = [] }) => {
  const { nombre: nombreRemitente, correo: correoRemitente } = remitente();

  if (process.env.BREVO_API_KEY) {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept:         'application/json',
      },
      body: JSON.stringify({
        sender:      { name: nombreRemitente, email: correoRemitente },
        to:          [{ email: para, ...(nombre ? { name: nombre } : {}) }],
        subject:     asunto,
        htmlContent: html,
        ...(adjuntos.length > 0 && {
          attachment: adjuntos.map((a) => ({ name: a.nombre, content: a.base64 })),
        }),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) {
      const detalle = await resp.text().catch(() => '');
      throw new Error(`Brevo respondió ${resp.status}: ${detalle.slice(0, 300)}`);
    }
    return;
  }

  if (!process.env.SMTP_HOST) {
    throw new Error('El servicio de correo no está configurado (falta BREVO_API_KEY o SMTP_HOST).');
  }

  await getTransporter().sendMail({
    from:    `"${nombreRemitente}" <${correoRemitente}>`,
    to:      para,
    subject: asunto,
    html,
    attachments: adjuntos.map((a) => ({ filename: a.nombre, content: a.base64, encoding: 'base64' })),
  });
};

/**
 * Traduce un error de envío a una explicación entendible para diagnosticar.
 * (No incluye contraseñas ni claves.)
 */
const describirErrorCorreo = (err) => {
  const codigo = err?.code ?? '';
  const texto  = String(err?.message ?? '');
  if (codigo === 'EAUTH' || /535|Username and Password not accepted|Invalid login/i.test(texto))
    return 'Gmail rechazó el usuario o la contraseña (SMTP_USER / SMTP_PASS). Debe ser una "contraseña de aplicación" de 16 letras; si se cambió la contraseña de la cuenta, Google la revoca y hay que generar una nueva.';
  if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNREFUSED', 'ENOTFOUND', 'EDNS'].includes(codigo))
    return 'No se pudo conectar con el servidor de correo (SMTP_HOST / SMTP_PORT o la red bloquea el puerto).';
  if (/Brevo respondió 401/.test(texto))
    return 'Brevo rechazó la clave BREVO_API_KEY (no es válida o fue eliminada).';
  if (/Brevo respondió 400/.test(texto) && /sender/i.test(texto))
    return 'Brevo no acepta el remitente: verifica MAIL_FROM_EMAIL en Brevo → Senders.';
  if (/no está configurado/.test(texto)) return texto;
  return texto.slice(0, 200) || 'Error desconocido al enviar el correo.';
};

// ── Utilidades ────────────────────────────────────────────────────────────────

// Escapa texto ingresado por usuarios antes de insertarlo en el HTML del correo
const esc = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Formatea una fecha de evento (Date de un campo DATE de pg, o 'YYYY-MM-DD')
 * sin que la zona horaria del servidor la desplace un día.
 */
const formatearFecha = (fecha) => {
  if (!fecha) return null;
  let y, m, d;
  if (fecha instanceof Date) {
    y = fecha.getFullYear(); m = fecha.getMonth(); d = fecha.getDate();
  } else {
    const p = String(fecha).slice(0, 10).split('-').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return String(fecha);
    [y, m, d] = [p[0], p[1] - 1, p[2]];
  }
  return new Date(Date.UTC(y, m, d, 12)).toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
};

// ── HTML base compartido ──────────────────────────────────────────────────────
const htmlBase = (contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Quinta Inés María</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0D2137;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="margin:0;color:#B7950B;font-size:26px;font-weight:700;letter-spacing:0.5px;">
              Quinta Inés María
            </h1>
            <p style="margin:6px 0 0;color:#ffffff80;font-size:12px;letter-spacing:1px;text-transform:uppercase;">
              BED · Catering · Eventos · Chambo, Chimborazo
            </p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">
            ${contenido}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0D2137;padding:20px 40px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="margin:0;color:#ffffff60;font-size:11px;">
              © ${new Date().getFullYear()} Quinta Inés María · Cantón Chambo, Chimborazo, Ecuador<br>
              Este correo fue generado automáticamente. No responder.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Piezas reutilizables ──────────────────────────────────────────────────────
const boton = (texto, url) =>
  `<p style="text-align:center;margin:28px 0;">
     <a href="${esc(url)}" style="display:inline-block;padding:14px 36px;background:#B7950B;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.3px;">
       ${texto}
     </a>
   </p>`;

const saludo = (nombre) =>
  `<p style="font-size:16px;color:#1A1A1A;margin:0 0 16px;">Hola, <strong>${esc(nombre)}</strong>,</p>`;

const parrafo = (html) =>
  `<p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">${html}</p>`;

const filaDato = (etiqueta, valor, destacado = false) =>
  `<tr>
     <td style="font-size:13px;color:#666;padding:6px 0;">${etiqueta}</td>
     <td style="font-size:13px;color:${destacado ? '#B7950B' : '#0D2137'};font-weight:700;text-align:right;">${valor}</td>
   </tr>`;

const tablaDatos = (filas) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border-radius:10px;padding:20px;margin:20px 0;">
     ${filas}
   </table>`;

const firma = () =>
  `<hr style="border:none;border-top:1px solid #E8E0D0;margin:28px 0;">
   <p style="font-size:13px;color:#888;margin:0;">
     Con cariño,<br>
     <strong style="color:#0D2137;">El equipo de la Quinta Inés María</strong>
   </p>`;

const urlFrontend = (ruta = '') =>
  `${(process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')}${ruta}`;

// =============================================================================
//  FUNCIONES DE ENVÍO
// =============================================================================

/** Verificación de cuenta (VERIFICACION_CORREO) */
const enviarVerificacionCorreo = async ({ nombre, correo, enlace }) => {
  const html = htmlBase(`
    ${saludo(nombre)}
    ${parrafo(`Gracias por registrarte en <strong>EventPlanner QIM</strong>.
      Para activar tu cuenta y comenzar a planificar tu evento, confirma tu correo electrónico.`)}
    ${boton('Verificar mi cuenta', enlace)}
    <p style="font-size:13px;color:#999;margin:16px 0 0;text-align:center;">
      El enlace expira en <strong>24 horas</strong>.<br>
      Si no creaste esta cuenta, ignora este correo.
    </p>
    ${firma()}
  `);

  await enviarCorreo({ para: correo, nombre, asunto: 'Verifica tu cuenta — Quinta Inés María', html });
};

/** Recuperación de contraseña (RESET_PASSWORD) */
const enviarResetPassword = async ({ nombre, correo, enlace }) => {
  const html = htmlBase(`
    ${saludo(nombre)}
    ${parrafo(`Recibimos una solicitud para restablecer la contraseña de tu cuenta.
      Haz clic en el botón para crear una nueva contraseña:`)}
    ${boton('Restablecer contraseña', enlace)}
    <div style="background:#FFF8E7;border-left:4px solid #B7950B;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#7A5D00;">
        <strong>⚠ Este enlace expira en 1 hora.</strong><br>
        Si no solicitaste este restablecimiento, ignora este correo. Tu contraseña no cambiará.
      </p>
    </div>
    ${firma()}
  `);

  await enviarCorreo({ para: correo, nombre, asunto: 'Recupera tu contraseña — Quinta Inés María', html });
};

/** Confirmación de solicitud recibida, con la cotización PDF adjunta (SOLICITUD_RECIBIDA) */
const enviarConfirmacionSolicitud = async ({ nombre, correo, numero, total, fechaEvento, pdfBase64 }) => {
  const fecha = formatearFecha(fechaEvento);
  const html = htmlBase(`
    ${saludo(nombre)}
    ${parrafo(`Hemos recibido tu solicitud de cotización.
      ${pdfBase64 ? 'Adjunto encontrarás el <strong>documento PDF</strong> con el desglose detallado de tu evento.' : ''}`)}
    ${tablaDatos(`
      ${filaDato('Número de solicitud', esc(numero))}
      ${fecha ? filaDato('Fecha del evento', esc(fecha)) : ''}
      ${filaDato('<strong>Total estimado</strong>', `$${Number(total).toFixed(2)}`, true)}
    `)}
    <p style="font-size:13px;color:#999;text-align:center;margin:0;">
      Nuestro equipo revisará tu solicitud y te contactará en las próximas 24 horas hábiles.
    </p>
    ${boton('Ver mis solicitudes', urlFrontend('/mis-solicitudes'))}
    ${firma()}
  `);

  await enviarCorreo({
    para: correo,
    nombre,
    asunto: `Tu cotización ${numero} — Quinta Inés María`,
    html,
    adjuntos: pdfBase64 ? [{ nombre: `Cotizacion-${numero}.pdf`, base64: pdfBase64 }] : [],
  });
};

/** Aviso al cliente cuando el administrador cambia el estado de su solicitud */
const TEXTOS_ESTADO = {
  EN_REVISION: {
    asunto: 'Estamos revisando tu solicitud',
    color:  '#1E90FF',
    texto:  'Nuestro equipo ya está <strong>revisando tu solicitud</strong>. Pronto nos pondremos en contacto contigo.',
  },
  CONFIRMADA: {
    asunto: '¡Tu evento está confirmado!',
    color:  '#228B22',
    texto:  '¡Excelentes noticias! Tu reserva ha sido <strong>confirmada</strong>. Recuerda que para separar la fecha se requiere el abono del 30% del valor estimado.',
  },
  RECHAZADA: {
    asunto: 'Actualización sobre tu solicitud',
    color:  '#DC143C',
    texto:  'Lamentamos informarte que tu solicitud <strong>no pudo ser aceptada</strong>. Si tienes dudas o deseas otra fecha, contáctanos.',
  },
  COMPLETADA: {
    asunto: '¡Gracias por celebrar con nosotros!',
    color:  '#2F4F4F',
    texto:  'Tu evento ha sido marcado como <strong>completado</strong>. Fue un honor ser parte de tu celebración. ¡Nos encantaría conocer tu opinión!',
  },
};

const enviarCambioEstado = async ({ nombre, correo, numero, estado, fechaEvento, observaciones }) => {
  const info = TEXTOS_ESTADO[estado];
  if (!info) return;
  const fecha = formatearFecha(fechaEvento);

  const html = htmlBase(`
    ${saludo(nombre)}
    ${parrafo(info.texto)}
    ${tablaDatos(`
      ${filaDato('Número de solicitud', esc(numero))}
      ${fecha ? filaDato('Fecha del evento', esc(fecha)) : ''}
      ${filaDato('Estado', `<span style="color:${info.color};">${esc(estado.replace('_', ' '))}</span>`)}
    `)}
    ${observaciones ? `
      <div style="background:#F5F0E8;border-left:4px solid #B7950B;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#7A5D00;text-transform:uppercase;letter-spacing:0.5px;">Mensaje del equipo</p>
        <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">${esc(observaciones)}</p>
      </div>` : ''}
    ${estado === 'COMPLETADA'
      ? boton('Dejar una reseña', urlFrontend('/resenias'))
      : boton('Ver mis solicitudes', urlFrontend('/mis-solicitudes'))}
    ${firma()}
  `);

  await enviarCorreo({ para: correo, nombre, asunto: `${info.asunto} (${numero}) — Quinta Inés María`, html });
};

/** Notificación de cancelación/eliminación permanente por parte del admin */
const enviarCancelacionSolicitud = async ({ nombre, correo, numero, motivo }) => {
  const html = htmlBase(`
    ${saludo(nombre)}
    ${parrafo(`Lamentamos informarte que tu solicitud con el número <strong>${esc(numero)}</strong> ha sido
      <strong style="color:#DC143C;">cancelada y eliminada del sistema</strong> por parte de nuestro equipo administrativo.`)}
    <div style="background:#FFF5F5;border-left:4px solid #DC143C;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#DC143C;text-transform:uppercase;letter-spacing:0.5px;">Motivo de cancelación</p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">${esc(motivo)}</p>
    </div>
    ${parrafo(`Si tienes alguna consulta o consideras que esto es un error, no dudes en contactarnos
      directamente a través de nuestros canales oficiales. Si deseas reagendar tu evento, puedes realizar
      una nueva solicitud en nuestro sistema.`)}
    ${firma()}
  `);

  await enviarCorreo({ para: correo, nombre, asunto: `Cancelación de solicitud ${numero} — Quinta Inés María`, html });
};

/** Recordatorio 7 días antes del evento (lo usa el cron diario) */
const enviarRecordatorioEvento = async ({ nombre, correo, numero, fechaEvento }) => {
  const html = htmlBase(`
    ${saludo(nombre)}
    ${parrafo(`¡Tu evento está a solo <strong>7 días</strong>! Queremos recordarte que tienes una reserva confirmada con nosotros.`)}
    ${tablaDatos(`
      ${filaDato('Número de solicitud', esc(numero))}
      ${filaDato('Fecha del evento', esc(formatearFecha(fechaEvento)), true)}
    `)}
    ${parrafo('Si tienes alguna consulta o necesitas ajustar algo, comunícate con nosotros lo antes posible.')}
    ${firma()}
  `);

  await enviarCorreo({
    para: correo,
    nombre,
    asunto: `⏰ Recordatorio: Tu evento en Quinta Inés María es en 7 días — ${numero}`,
    html,
  });
};

module.exports = {
  enviarCorreo,
  describirErrorCorreo,
  formatearFecha,
  enviarVerificacionCorreo,
  enviarResetPassword,
  enviarConfirmacionSolicitud,
  enviarCambioEstado,
  enviarCancelacionSolicitud,
  enviarRecordatorioEvento,
};
