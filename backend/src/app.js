'use strict';
const express           = require('express');
const cors              = require('cors');
const helmet            = require('helmet');
const morgan            = require('morgan');
const errorHandler      = require('./middlewares/errorHandler');

const authRoutes         = require('./modules/auth/auth.routes');
const catalogoRoutes     = require('./modules/catalogo/catalogo.routes');
const galeriaRoutes      = require('./modules/galeria/galeria.routes');
const configuradorRoutes = require('./modules/configurador/configurador.routes'); // Sprint 4 ✅

const app = express();

app.use(helmet());
app.use(cors({
  origin:         process.env.FRONTEND_URL,
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          authRoutes);
app.use('/api/catalogo',      catalogoRoutes);
app.use('/api/galeria',       galeriaRoutes);
app.use('/api/configurador',  configuradorRoutes);  // ← Sprint 4

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'EventPlanner QIM API', sprint: 'Sprint 4', timestamp: new Date().toISOString() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Ruta '${req.originalUrl}' no encontrada.` })
);

app.use(errorHandler);
module.exports = app;
