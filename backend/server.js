require("dotenv").config();
const app = require("./src/app");
require("./src/config/db");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Base de datos: ${process.env.DB_NAME}\n`);
});
