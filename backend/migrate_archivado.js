const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('[MIGRATE] Agregando columna archivado a eqim_solicitudes...');
    await pool.query(`
      ALTER TABLE eqim_solicitudes.eqim_solicitudes 
      ADD COLUMN IF NOT EXISTS archivado BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('[MIGRATE] ✅ Columna archivado agregada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE] ❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
