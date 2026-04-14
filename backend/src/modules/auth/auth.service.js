const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const registerUser = async ({ nombre, email, password }) => {
  // 1. Verificamos si el correo ya existe
  const exists = await pool.query(
    "SELECT usuario_id FROM eqim_seguridad.usuarios WHERE correo = $1",
    [email],
  );
  if (exists.rows.length > 0) {
    const err = new Error("El correo ya está registrado.");
    err.statusCode = 409;
    throw err;
  }

  // 2. Buscamos dinámicamente el ID del rol 'CLIENTE' en tu tabla roles
  // (Asumiendo que guardas el código como 'CLIENTE' o 'cliente')
  const roleQuery = await pool.query(
    "SELECT rol_id FROM eqim_seguridad.roles WHERE rol_codigo = 'CLIENTE'",
  );
  if (roleQuery.rows.length === 0) {
    const err = new Error(
      "Error de servidor: El rol CLIENTE no existe en la base de datos.",
    );
    err.statusCode = 500;
    throw err;
  }
  const clienteRolId = roleQuery.rows[0].rol_id;

  // 3. Ciframos la contraseña
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4. Insertamos el usuario vinculando el rol dinámico
  const result = await pool.query(
    `INSERT INTO eqim_seguridad.usuarios (nombre_completo, correo, password_hash, rol_id) 
     VALUES ($1, $2, $3, $4) 
     RETURNING usuario_id, nombre_completo, correo, rol_id`,
    [nombre, email, hashedPassword, clienteRolId],
  );

  return result.rows[0];
};

const loginUser = async ({ email, password }) => {
  // Buscamos al usuario
  const result = await pool.query(
    "SELECT * FROM eqim_seguridad.usuarios WHERE correo = $1 AND activo = true",
    [email],
  );

  if (result.rows.length === 0) {
    const err = new Error("Credenciales inválidas.");
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    const err = new Error("Credenciales inválidas.");
    err.statusCode = 401;
    throw err;
  }

  // Generamos el token JWT
  const token = jwt.sign(
    { id: user.usuario_id, email: user.correo, rol_id: user.rol_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  return {
    token,
    user: {
      id: user.usuario_id,
      nombre: user.nombre_completo,
      email: user.correo,
      rol_id: user.rol_id,
    },
  };
};

module.exports = { registerUser, loginUser };
