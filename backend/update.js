const pool = require('./src/config/db');

async function run() {
  await pool.query("UPDATE eqim_catalogo.estilos_decoracion SET icono = 'Sparkles' WHERE icono IS NULL");
  await pool.query("UPDATE eqim_catalogo.centros_mesa SET icono = 'Sparkles' WHERE icono IS NULL");
  await pool.query("UPDATE eqim_catalogo.servicios_adicionales SET icono = 'Sparkles' WHERE icono IS NULL");
  console.log('Icons updated');
  process.exit(0);
}
run();
