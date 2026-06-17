const pool = require('./src/config/db');

// =============================================================================
//  MIGRACIÓN: tabla de reseñas de la comunidad (eqim_catalogo.resenias)
//  Ejecutar una sola vez:  node migrate_resenias.js
// =============================================================================
async function migrate() {
  try {
    console.log('[MIGRATE] Creando tabla eqim_catalogo.resenias...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS eqim_catalogo.resenias (
        resenia_id   SERIAL PRIMARY KEY,
        usuario_id   INTEGER     NOT NULL REFERENCES eqim_seguridad.usuarios(usuario_id) ON DELETE CASCADE,
        calificacion SMALLINT    NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
        comentario   TEXT        NOT NULL,
        aprobada     BOOLEAN     NOT NULL DEFAULT true,
        activo       BOOLEAN     NOT NULL DEFAULT true,
        creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_resenias_visibles
      ON eqim_catalogo.resenias (creado_en DESC)
      WHERE aprobada = true AND activo = true
    `);
    console.log('[MIGRATE] ✅ Tabla eqim_catalogo.resenias lista');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE] ❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
