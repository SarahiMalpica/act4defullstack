/**
 * src/controllers/authController.js
 * Controladores de registro e inicio de sesion.
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginLog = require("../models/LoginLog");

function signToken(user) {
  // Payload minimo: id y usuario
  const payload = { id: user._id.toString(), usuario: user.usuario };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h"
  });
}

/**
 * POST /auth/register
 * Body: { usuario, password }
 */
async function register(req, res) {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  const exists = await User.findOne({ usuario });
  if (exists) {
    return res.status(400).json({ mensaje: "Usuario ya existe" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ usuario, passwordHash });

  // (Opcional) devolver token al registrar
  const token = signToken(user);

  return res.status(201).json({
    mensaje: "Usuario registrado",
    token
  });
}

/**
 * POST /auth/login
 * Body: { usuario, password }
 */
async function login(req, res) {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  const user = await User.findOne({ usuario });
  if (!user) {
    return res.status(404).json({ mensaje: "Usuario incorrecto" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ mensaje: "Contrasena incorrecta" });
  }

  await LoginLog.create({ usuario: user.usuario });

  const token = signToken(user);
  return res.json({ token });
}

/**
 * GET /auth/logins
 * Query: ?limit=10
 */
async function listLogins(req, res) {
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 10;

  const logs = await LoginLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select({ usuario: 1, createdAt: 1 })
    .lean();

  return res.json(logs);
}

/**
 * POST /auth/logout
 * JWT stateless: el cliente elimina el token localmente.
 */
async function logout(req, res) {
  return res.json({ mensaje: "Sesion cerrada" });
}

module.exports = { register, login, logout, listLogins };
