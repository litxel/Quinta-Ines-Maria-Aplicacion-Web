'use strict';
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Pool de conexiones a PostgreSQL.
 *
 * SOLUCIÓN UTF-8:
 * La propiedad `options` fuerza al cliente pg a usar UTF-8 desde la
 * cadena de conexión. Esto corrige los caracteres rotos:
 *   bÃ¡sico        → básico
 *   QuinceaÃ±eras  → Quinceañeras
 *   decoraciÃ³n    → decoración
 *
 * El evento 'connect' reafirma el encoding en cada nueva conexión
 * del pool para máxima garantía.
 */
const pool = new Pool({
  host:                    process.env.DB_HOST,
  port:                    parseInt(process.env.DB_PORT, 10),
  database:                process.env.DB_NAME,
  user:                    process.env.DB_USER,
  password:                process.env.DB_PASSWORD,
  // ── LÍNEA CLAVE — fuerza UTF-8 en la conexión ──────────────────────────────
  options:                 '-c client_encoding=UTF8',
  // ─────────────────────────────────────────────────────────────────────────────
  max:                     10,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 3000,
});

// Reafirmar encoding en cada conexión nueva del pool
pool.on('connect', (client) => {
  client.query("SET client_encoding = 'UTF8'").catch((err) =>
    console.warn('⚠️  client_encoding:', err.message)
  );
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('\n❌  Error conectando a PostgreSQL:', err.message);
    process.exit(1);
  }
  console.log('✅  PostgreSQL conectado:', process.env.DB_NAME);
  release();
});

pool.on('error', (err) =>
  console.error('⚠️   Pool error inesperado:', err.message)
);

module.exports = pool;
