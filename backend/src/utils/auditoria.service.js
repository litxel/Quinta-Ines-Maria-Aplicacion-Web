'use strict';
const pool = require('../config/db');

const registrarLogAutenticacion = async ({
  correo,
  exitoso,
  ipOrigen    = null,
  userAgent   = null,
  motivoFallo = null,
}) => {
  try {
    await pool.query(
      `INSERT INTO eqim_auditoria.log_autenticacion
         (correo, exitoso, ip_origen, user_agent, motivo_fallo)
       VALUES ($1, $2, $3, $4, $5)`,
      [correo, exitoso, ipOrigen, userAgent, motivoFallo]
    );
  } catch (err) {
    console.error('⚠️  Auditoría [log_autenticacion]:', err.message);
  }
};

const registrarLogOperacion = async ({
  schemaTabla,
  operacion,
  usuarioId        = null,
  datosAnteriores  = null,
  datosNuevos      = null,
  ipOrigen         = null,
  userAgent        = null,
  descripcion      = null,
  exitoso          = true,
}) => {
  try {
    await pool.query(
      `INSERT INTO eqim_auditoria.log_operaciones
         (schema_tabla, operacion, usuario_id,
          datos_anteriores, datos_nuevos,
          ip_origen, user_agent, descripcion, exitoso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        schemaTabla,
        operacion,
        usuarioId,
        datosAnteriores ? JSON.stringify(datosAnteriores) : null,
        datosNuevos     ? JSON.stringify(datosNuevos)     : null,
        ipOrigen,
        userAgent,
        descripcion,
        exitoso,
      ]
    );
  } catch (err) {
    console.error('⚠️  Auditoría [log_operaciones]:', err.message);
  }
};

module.exports = { registrarLogAutenticacion, registrarLogOperacion };