const { registerUser, loginUser } = require("./auth.service");

const register = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nombre, email y contraseña son requeridos.",
        });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({
          success: false,
          message: "La contraseña debe tener mínimo 8 caracteres.",
        });
    }
    const user = await registerUser({ nombre, email, password });
    res
      .status(201)
      .json({ success: true, message: "Usuario registrado.", data: user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email y contraseña son requeridos.",
        });
    }
    const data = await loginUser({ email, password });
    res.json({ success: true, message: "Inicio de sesión exitoso.", ...data });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { register, login, getProfile };
