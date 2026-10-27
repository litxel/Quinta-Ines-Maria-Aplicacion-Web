'use strict';
const { Pool } = require('pg');

/**
 * Pool de conexiones a PostgreSQL.
 *
 * PRODUCCIÓN (Neon): se usa DATABASE_URL con SSL obligatorio. Neon ya trabaja
 * en UTF-8, así que no se envía el parámetro `options` (su pooler lo rechaza).
 *
 * LOCAL: se usan las variables DB_*. La propiedad `options` fuerza UTF-8 desde
 * la conexión para evitar caracteres rotos (bÃ¡sico → básico).
 */
const conexion = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
    }
  : {
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options:  '-c client_encoding=UTF8',
    };

const pool = new Pool({
  ...conexion,
  max:                     10,
  idleTimeoutMillis:       30000,
  // Neon suspende la BD tras 5 min sin uso; despertarla puede tardar unos segundos.
  connectionTimeoutMillis: 10000,
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
  console.log('✅  PostgreSQL conectado');
  release();
});

pool.on('error', (err) =>
  console.error('⚠️   Pool error inesperado:', err.message)
);

module.exports = pool;
