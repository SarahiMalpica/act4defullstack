/**
 * src/middlewares/auth.js
 * Middleware que protege rutas con JWT.
 * Espera header: Authorization: Bearer <token>
 */
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization;

  // 1) Debe existir Authorization
  if (!header) {
    return res.status(401).json({ mensaje: "Token requerido (Authorization header)" });
  }

  // 2) Debe ser tipo Bearer
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ mensaje: "Formato inválido. Usa: Bearer <token>" });
  }

  // 3) Verificar JWT
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Guardamos lo que venga en el payload para uso posterior
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ mensaje: "Token inválido o expirado" });
  }
}

module.exports = { auth };
