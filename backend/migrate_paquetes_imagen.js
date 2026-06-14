const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('[MIGRATE] Agregando imagen_url a paquetes...');
    await pool.query(`
      ALTER TABLE eqim_catalogo.paquetes
      ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500)
    `);
    console.log('[MIGRATE] ✅ imagen_url agregada a paquetes');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE] ❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
