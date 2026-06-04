'use strict';
const cron   = require('node-cron');
const pool   = require('../config/db');
const email  = require('./email.service');
const nodemailer = require('nodemailer');
require('dotenv').config();

// ── CRON A: Recordatorios 7 días antes del evento (08:00 AM diario) ─────────
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Ejecutando recordatorios de eventos a 7 días...');
  try {
    const { rows } = await pool.query(`
      SELECT
        s.solicitud_id,
        s.numero_solicitud,
        s.fecha_evento,
        u.nombre_completo,
        u.correo,
        COALESCE(s.telefono_contacto, u.telefono) AS telefono
      FROM eqim_solicitudes.eqim_solicitudes s
      JOIN eqim_seguridad.usuarios u ON u.usuario_id = s.usuario_id
      JOIN eqim_solicitudes.estados est ON est.estado_id = s.estado_id
      WHERE est.estado_codigo = 'CONFIRMADA'
        AND s.fecha_evento = CURRENT_DATE + INTERVAL '7 days'
    `);

    for (const sol of rows) {
      await enviarRecordatorio({ 
        nombre: sol.nombre_completo,
        correo: sol.correo,
        numero: sol.numero_solicitud,
        fechaEvento: sol.fecha_evento
      });
      console.log(`[CRON] Recordatorio enviado a ${sol.correo} para solicitud ${sol.numero_solicitud}`);
    }
    console.log(`[CRON] ${rows.length} recordatorios enviados.`);
  } catch (err) {
    console.error('[CRON] Error en recordatorios:', err.message);
  }
}, { timezone: 'America/Guayaquil' });

// ── CRON B: Limpieza de tokens expirados (03:00 AM diario) ──────────────────
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Ejecutando limpieza de tokens expirados...');
  try {
    await pool.query('SELECT eqim_auditoria.fn_limpiar_expirados()');
    console.log('[CRON] Tokens expirados limpiados correctamente.');
  } catch (err) {
    console.error('[CRON] Error en limpieza de tokens:', err.message);
  }
}, { timezone: 'America/Guayaquil' });

// ── Helper: correo de recordatorio inline ────────────────────────────────────
const enviarRecordatorio = async ({ nombre, correo, numero, fechaEvento }) => {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls:  { rejectUnauthorized: false },
  });

  const fecha = new Date(fechaEvento).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#0D2137;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;color:#B7950B;font-size:26px;font-weight:700;">Quinta Inés María</h1>
          <p style="margin:6px 0 0;color:#ffffff80;font-size:12px;letter-spacing:1px;text-transform:uppercase;">BED · Catering · Eventos · Chambo, Chimborazo</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:40px;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">
          <p style="font-size:16px;color:#1A1A1A;margin:0 0 16px;">Hola, <strong>${nombre}</strong>,</p>
          <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">
            ¡Tu evento está a solo <strong>7 días</strong>! Queremos recordarte que tienes una reserva confirmada con nosotros.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border-radius:10px;padding:20px;margin:20px 0;">
            <tr>
              <td style="font-size:13px;color:#666;padding:6px 0;">Número de solicitud</td>
              <td style="font-size:13px;color:#0D2137;font-weight:700;text-align:right;">${numero}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#666;padding:6px 0;">Fecha del evento</td>
              <td style="font-size:13px;color:#B7950B;font-weight:700;text-align:right;">${fecha}</td>
            </tr>
          </table>
          <p style="font-size:14px;color:#555;line-height:1.7;">
            Si tienes alguna consulta o necesitas ajustar algo, comunícate con nosotros lo antes posible.
          </p>
          <hr style="border:none;border-top:1px solid #E8E0D0;margin:28px 0;">
          <p style="font-size:13px;color:#888;margin:0;">Con cariño,<br><strong style="color:#0D2137;">El equipo de la Quinta Inés María</strong></p>
        </td></tr>
        <tr><td style="background:#0D2137;padding:20px 40px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="margin:0;color:#ffffff60;font-size:11px;">© 2026 Quinta Inés María · Cantón Chambo, Chimborazo, Ecuador<br>Este correo fue generado automáticamente. No responder.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await transporter.sendMail({
    from:    `"Quinta Inés María" <${process.env.SMTP_USER}>`,
    to:      correo,
    subject: `⏰ Recordatorio: Tu evento en Quinta Inés María es en 7 días — ${numero}`,
    html,
  });
};

console.log('[CRON] Jobs de mantenimiento registrados: recordatorios (08:00) y limpieza tokens (03:00).');
module.exports = {};
