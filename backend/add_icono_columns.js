const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('Adding icono columns...');
    await pool.query('ALTER TABLE eqim_catalogo.estilos_decoracion ADD COLUMN IF NOT EXISTS icono VARCHAR(50) DEFAULT \'Sparkles\'');
    await pool.query('ALTER TABLE eqim_catalogo.centros_mesa ADD COLUMN IF NOT EXISTS icono VARCHAR(50) DEFAULT \'Sparkles\'');
    await pool.query('ALTER TABLE eqim_catalogo.servicios_adicionales ADD COLUMN IF NOT EXISTS icono VARCHAR(50) DEFAULT \'Sparkles\'');
    console.log('Columns added successfully.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

migrate();
