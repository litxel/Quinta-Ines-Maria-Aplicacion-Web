'use strict';

// Reglas de validación compartidas por registro, recuperación y cambio de contraseña

const PASS_RE  = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE   = /^\+?[0-9\s-]{7,20}$/;

// Devuelve el primer error de la contraseña o null (bcrypt solo usa 72 bytes)
const errorPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.';
  if (Buffer.byteLength(password, 'utf8') > 72)           return 'La contraseña no puede superar 72 caracteres.';
  if (!PASS_RE.test(password))                            return 'La contraseña debe tener al menos una mayúscula, una minúscula y un número.';
  return null;
};

module.exports = { PASS_RE, EMAIL_RE, TEL_RE, errorPassword };
