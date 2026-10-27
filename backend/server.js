require("dotenv").config({ quiet: true });

// Las fechas DATE de PostgreSQL se convierten a la medianoche de esta zona.
// Los hostings corren en UTC: sin esto, en Ecuador las fechas se verían un día antes.
process.env.TZ = process.env.TZ || 'America/Guayaquil';

const app = require("./src/app");
require("./src/config/db");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`📚 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Base de datos: ${process.env.DATABASE_URL ? 'DATABASE_URL (remota)' : process.env.DB_NAME}\n`);
});
