'use strict';
const express           = require('express');
const cors              = require('cors');
const helmet            = require('helmet');
const morgan            = require('morgan');
const compression       = require('compression');
const passport          = require('passport');
const errorHandler      = require('./middlewares/errorHandler');
const limites           = require('./middlewares/rateLimit');
const path              = require('path');

const authRoutes         = require('./modules/auth/auth.routes');
const catalogoRoutes     = require('./modules/catalogo/catalogo.routes');
const galeriaRoutes      = require('./modules/galeria/galeria.routes');
const configuradorRoutes = require('./modules/configurador/configurador.routes');
const solicitudesRoutes  = require('./modules/solicitudes/solicitudes.routes');
const usuariosRoutes     = require('./modules/usuarios/usuarios.routes');
const reportesRoutes     = require('./modules/reportes/reportes.routes');
const reseniasRoutes     = require('./modules/resenias/resenias.routes');

require('./utils/cron.jobs');  // Inicia tareas programadas (Sprint 6)

const app = express();
const esProduccion = process.env.NODE_ENV === 'production';

// Render (y la mayoría de hostings) ponen un proxy delante de la app. Sin esto,
// req.ip sería la IP del proxy y el límite de peticiones bloquearía a todos a la vez.
app.set('trust proxy', 1);

// FRONTEND_URL admite varias URLs separadas por coma (p. ej. pages.dev + dominio propio)
const origenesPermitidos = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin:         origenesPermitidos,
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(morgan(esProduccion ? 'tiny' : 'dev'));
app.use(passport.initialize());

// Las imágenes llegan en base64 (máx. 5 MB → ~7 MB en base64) y el PDF de la
// cotización también; 15 MB cubre ambos casos sin agotar la RAM del servidor.
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Imágenes antiguas guardadas en disco (en producción las nuevas van a Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), { maxAge: '7d' }));

// ── Health check (no toca la BD: sirve para mantener despierto el servidor) ──
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'EventPlanner QIM API', timestamp: new Date().toISOString() })
);

// ── Límite general de peticiones ──────────────────────────────────────────────
app.use('/api', limites.general);

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/catalogo',      catalogoRoutes);
app.use('/api/galeria',       galeriaRoutes);
app.use('/api/configurador',  configuradorRoutes);
app.use('/api/solicitudes',   solicitudesRoutes);
app.use('/api/usuarios',      usuariosRoutes);
app.use('/api/reportes',      reportesRoutes);
app.use('/api/resenias',      reseniasRoutes);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Ruta '${req.originalUrl}' no encontrada.` })
);

app.use(errorHandler);
module.exports = app;
