'use strict';
const cron   = require('node-cron');
const pool   = require('../config/db');
const email  = require('./email.service');

// ── CRON A: Recordatorios 7 días antes del evento (08:00 AM diario) ─────────
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Ejecutando recordatorios de eventos a 7 días...');
  try {
    const { rows } = await pool.query(`
      SELECT
        s.numero_solicitud,
        s.fecha_evento,
        u.nombre_completo,
        u.correo
      FROM eqim_solicitudes.eqim_solicitudes s
      JOIN eqim_seguridad.usuarios u ON u.usuario_id = s.usuario_id
      JOIN eqim_solicitudes.estados est ON est.estado_id = s.estado_id
      WHERE est.codigo = 'CONFIRMADA'
        AND s.archivado = false
        AND s.fecha_evento = (now() AT TIME ZONE 'America/Guayaquil')::date + 7
    `);

    let enviados = 0;
    for (const sol of rows) {
      try {
        await email.enviarRecordatorioEvento({
          nombre:      sol.nombre_completo,
          correo:      sol.correo,
          numero:      sol.numero_solicitud,
          fechaEvento: sol.fecha_evento,
        });
        enviados++;
        console.log(`[CRON] Recordatorio enviado para solicitud ${sol.numero_solicitud}`);
      } catch (err) {
        console.error(`[CRON] No se pudo enviar el recordatorio de ${sol.numero_solicitud}:`, err.message);
      }
    }
    console.log(`[CRON] ${enviados}/${rows.length} recordatorios enviados.`);
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

console.log('[CRON] Jobs de mantenimiento registrados: recordatorios (08:00) y limpieza tokens (03:00).');
module.exports = {};
