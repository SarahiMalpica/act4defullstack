/**
 * src/middlewares/errorHandler.js
 * Middleware centralizado de errores.
 * Si en controllers lanzas throw new Error(), termina aquí.
 */
function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Si ya enviaron respuesta, delega
  if (res.headersSent) return next(err);

  res.status(500).json({
    mensaje: "Error interno del servidor",
    detalle: process.env.NODE_ENV === "test" ? String(err.message || err) : undefined
  });
}

module.exports = { errorHandler };
