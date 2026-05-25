'use strict';
const express           = require('express');
const cors              = require('cors');
const helmet            = require('helmet');
const morgan            = require('morgan');
const errorHandler      = require('./middlewares/errorHandler');
const path              = require('path');

const authRoutes         = require('./modules/auth/auth.routes');
const catalogoRoutes     = require('./modules/catalogo/catalogo.routes');
const galeriaRoutes      = require('./modules/galeria/galeria.routes');
const configuradorRoutes = require('./modules/configurador/configurador.routes'); 
const solicitudesRoutes  = require('./modules/solicitudes/solicitudes.routes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin:         process.env.FRONTEND_URL,
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));

// Límites originales de 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Exponer la carpeta public y decirle a Express que /uploads está dentro de public
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/catalogo',      catalogoRoutes);
app.use('/api/galeria',       galeriaRoutes);
app.use('/api/configurador',  configuradorRoutes);
app.use('/api/solicitudes',   solicitudesRoutes);

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'EventPlanner QIM API', sprint: 'Sprint 5', timestamp: new Date().toISOString() })
);

// SOLUCIÓN AQUÍ: Quitamos el '*' y dejamos solo la función
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Ruta '${req.originalUrl}' no encontrada.` })
);

app.use(errorHandler);
module.exports = app;