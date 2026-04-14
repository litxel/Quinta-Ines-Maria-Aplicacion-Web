const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middlewares/errorHandler");
const authRoutes = require("./modules/auth/auth.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "EventPlanner QIM API funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// SOLUCIÓN EXPRESS 5.0: Se quita el '*' para que atrape cualquier ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada." });
});

app.use(errorHandler);

module.exports = app;
