// Códigos de PostgreSQL que son errores del cliente, no del servidor
const ERRORES_PG = {
  '23505': { status: 409, message: 'Ese registro ya existe.' },
  '23503': { status: 409, message: 'El registro está relacionado con otros datos o hace referencia a uno inexistente.' },
  '22P02': { status: 400, message: 'Alguno de los datos enviados tiene un formato inválido.' },
  '22007': { status: 400, message: 'La fecha enviada no es válida.' },
  '22008': { status: 400, message: 'La fecha enviada no es válida.' },
};

const errorHandler = (err, req, res, next) => {
  const esProduccion = process.env.NODE_ENV === 'production';

  let statusCode = err.statusCode || err.status || 500;
  let message    = err.message || 'Error interno del servidor';

  if (err.type === 'entity.too.large') {
    statusCode = 413; message = 'El archivo enviado es demasiado grande.';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400; message = 'El cuerpo de la petición no es un JSON válido.';
  } else if (!err.statusCode && ERRORES_PG[err.code]) {
    ({ status: statusCode, message } = ERRORES_PG[err.code]);
  }

  if (statusCode >= 500) console.error("🔴 Error:", err.stack);

  res.status(statusCode).json({
    success: false,
    // En producción no se exponen mensajes internos (nombres de tablas, columnas…)
    message: statusCode >= 500 && esProduccion
      ? 'Ocurrió un error interno. Intenta nuevamente en unos minutos.'
      : message,
    ...(err.codigo && { code: err.codigo }),
    ...(!esProduccion && statusCode >= 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
