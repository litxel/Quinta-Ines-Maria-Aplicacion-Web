'use strict';
const nodemailer = require('nodemailer');
require('dotenv').config();

// =============================================================================
//  SERVICIO DE EMAIL — EventPlanner QIM
//  Usa las plantillas de eqim_notificaciones.plantillas (ya en la BD):
//    VERIFICACION_CORREO, RESET_PASSWORD, SOLICITUD_RECIBIDA, etc.
//  Por ahora genera HTML directamente para no agregar consultas extra.
// =============================================================================

// ── Crear transporter (se reutiliza en todo el proceso) ───────────────────────
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
    tls: { rejectUnauthorized: false },  // útil en desarrollo local
  });

  return transporter;
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
              © 2026 Quinta Inés María · Cantón Chambo, Chimborazo, Ecuador<br>
              Este correo fue generado automáticamente. No responder.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Botón reutilizable ────────────────────────────────────────────────────────
const boton = (texto, url) =>
  `<p style="text-align:center;margin:28px 0;">
     <a href="${url}" style="display:inline-block;padding:14px 36px;background:#B7950B;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.3px;">
       ${texto}
     </a>
   </p>`;

const saludo = (nombre) =>
  `<p style="font-size:16px;color:#1A1A1A;margin:0 0 16px;">Hola, <strong>${nombre}</strong>,</p>`;

const firma = () =>
  `<hr style="border:none;border-top:1px solid #E8E0D0;margin:28px 0;">
   <p style="font-size:13px;color:#888;margin:0;">
     Con cariño,<br>
     <strong style="color:#0D2137;">El equipo de la Quinta Inés María</strong>
   </p>`;

// =============================================================================
//  FUNCIONES DE ENVÍO
// =============================================================================

/**
 * Verificación de cuenta (código: VERIFICACION_CORREO)
 * @param {{ nombre:string, correo:string, enlace:string }} param
 */
const enviarVerificacionCorreo = async ({ nombre, correo, enlace }) => {
  const html = htmlBase(`
    ${saludo(nombre)}
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">
      Gracias por registrarte en <strong>EventPlanner QIM</strong>.
      Para activar tu cuenta y comenzar a planificar tu evento, confirma tu correo electrónico.
    </p>
    ${boton('Verificar mi cuenta', enlace)}
    <p style="font-size:13px;color:#999;margin:16px 0 0;text-align:center;">
      El enlace expira en <strong>24 horas</strong>.<br>
      Si no creaste esta cuenta, ignora este correo.
    </p>
    ${firma()}
  `);

  await getTransporter().sendMail({
    from:    `"Quinta Inés María" <${process.env.SMTP_USER}>`,
    to:      correo,
    subject: 'Verifica tu cuenta — Quinta Inés María',
    html,
  });
};

/**
 * Recuperación de contraseña (código: RESET_PASSWORD)
 * @param {{ nombre:string, correo:string, enlace:string }} param
 */
const enviarResetPassword = async ({ nombre, correo, enlace }) => {
  const html = htmlBase(`
    ${saludo(nombre)}
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
      Haz clic en el botón para crear una nueva contraseña:
    </p>
    ${boton('Restablecer contraseña', enlace)}
    <div style="background:#FFF8E7;border-left:4px solid #B7950B;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#7A5D00;">
        <strong>⚠ Este enlace expira en 1 hora.</strong><br>
        Si no solicitaste este restablecimiento, ignora este correo. Tu contraseña no cambiará.
      </p>
    </div>
    ${firma()}
  `);

  await getTransporter().sendMail({
    from:    `"Quinta Inés María" <${process.env.SMTP_USER}>`,
    to:      correo,
    subject: 'Recupera tu contraseña — Quinta Inés María',
    html,
  });
};

/**
 * Confirmación de solicitud recibida (código: SOLICITUD_RECIBIDA)
 * @param {{ nombre:string, correo:string, numero:string, total:number, fechaEvento?:string }} param
 */
/**
 * Confirmación de solicitud recibida con PDF adjunto (código: SOLICITUD_RECIBIDA)
 */
const enviarConfirmacionSolicitud = async ({ nombre, correo, numero, total, fechaEvento, pdfBase64 }) => {
  const html = htmlBase(`
    ${saludo(nombre)}
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">
      Hemos recibido tu solicitud de cotización formal. Adjunto a este correo encontrarás 
      el <strong>documento PDF</strong> con el desglose detallado de tu evento.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border-radius:10px;padding:20px;margin:20px 0;">
      <tr>
        <td style="font-size:13px;color:#666;padding:6px 0;">Número de solicitud</td>
        <td style="font-size:13px;color:#0D2137;font-weight:700;text-align:right;">${numero}</td>
      </tr>
      ${fechaEvento ? `<tr>
        <td style="font-size:13px;color:#666;padding:6px 0;">Fecha del evento</td>
        <td style="font-size:13px;color:#0D2137;font-weight:700;text-align:right;">${fechaEvento}</td>
      </tr>` : ''}
      <tr>
        <td style="font-size:13px;color:#666;padding:6px 0;border-top:1px solid #E8E0D0;padding-top:14px;">
          <strong>Total estimado</strong>
        </td>
        <td style="font-size:20px;color:#B7950B;font-weight:700;text-align:right;border-top:1px solid #E8E0D0;padding-top:14px;">
          $${Number(total).toFixed(2)}
        </td>
      </tr>
    </table>
    <p style="font-size:13px;color:#999;text-align:center;margin:0;">
      Nuestro equipo revisará tu solicitud y te contactará en las próximas 24 horas hábiles.
    </p>
    ${firma()}
  `);

  // Configuramos el correo
  const mailOptions = {
    from:    `"Quinta Inés María" <${process.env.SMTP_USER}>`,
    to:      correo,
    subject: `Tu cotización ${numero} — Quinta Inés María`,
    html,
  };

  // Si nos mandan el PDF desde el Frontend, lo adjuntamos
  if (pdfBase64) {
    mailOptions.attachments = [
      {
        filename: `Cotizacion-${numero}.pdf`,
        // Limpiamos el texto base64 por si viene con la cabecera de datos
        content: pdfBase64.includes("base64,") ? pdfBase64.split("base64,")[1] : pdfBase64,
        encoding: 'base64'
      }
    ];
  }

  await getTransporter().sendMail(mailOptions);
};

module.exports = {
  enviarVerificacionCorreo,
  enviarResetPassword,
  enviarConfirmacionSolicitud,
};