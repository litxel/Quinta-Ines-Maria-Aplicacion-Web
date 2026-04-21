const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Acceso denegado." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Token inválido." });
  }
};

const isAdmin = (req, res, next) => {
  // Verifica que el usuario tenga el rol de administrador
  // (Acepta 'ADMIN' o 'administrador' dependiendo de cómo lo guardes en el token)
  if (req.user && (req.user.rol === 'ADMIN' || req.user.rol === 'administrador')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: "Acceso denegado: se requiere rol de administrador." 
    });
  }
};

// ¡Ahora sí exportamos ambas funciones!
module.exports = { verifyToken, isAdmin };