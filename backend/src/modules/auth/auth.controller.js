const { registerUser, loginUser } = require("./auth.service");
const {
  registrarLogAutenticacion,
  registrarLogOperacion,
} = require("../../utils/auditoria.service");

const register = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email y contraseña son requeridos.",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener mínimo 8 caracteres.",
      });
    }

    const user = await registerUser({ nombre, email, password });

    // Registro de auditoría (Operación exitosa)
    await registrarLogOperacion({
      schema_tabla: "eqim_seguridad.usuarios",
      operacion: "INSERT",
      usuario_id: user.usuario_id,
      datos_nuevos: { correo: user.correo, nombre: user.nombre_completo },
      ip_origen: req.ip,
      user_agent: req.headers["user-agent"],
      descripcion: "Registro de nuevo usuario cliente",
      exitoso: true,
    });

    res
      .status(201)
      .json({ success: true, message: "Usuario registrado.", data: user });
  } catch (error) {
    // Si falla el registro, también lo guardamos
    await registrarLogOperacion({
      schema_tabla: "eqim_seguridad.usuarios",
      operacion: "INSERT",
      usuario_id: null,
      ip_origen: req.ip,
      user_agent: req.headers["user-agent"],
      descripcion: `Fallo en registro: ${error.message}`,
      exitoso: false,
    });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos.",
      });
    }

    const data = await loginUser({ email, password });

    // Auditoría de autenticación exitosa
    await registrarLogAutenticacion({
      correo: email,
      exitoso: true,
      ip_origen: req.ip,
      user_agent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Inicio de sesión exitoso.", ...data });
  } catch (error) {
    // Auditoría de autenticación fallida
    await registrarLogAutenticacion({
      correo: req.body.email || "desconocido",
      exitoso: false,
      ip_origen: req.ip,
      user_agent: req.headers["user-agent"],
      motivo_fallo: error.message,
    });
    next(error);
  }
};

const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { register, login, getProfile };
