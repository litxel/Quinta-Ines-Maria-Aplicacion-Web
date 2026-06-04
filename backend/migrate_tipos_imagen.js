const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('[MIGRATE] Agregando imagen_url a tipos_evento...');
    await pool.query(`
      ALTER TABLE eqim_catalogo.tipos_evento 
      ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500)
    `);
    console.log('[MIGRATE] ✅ imagen_url agregada a tipos_evento');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE] ❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
