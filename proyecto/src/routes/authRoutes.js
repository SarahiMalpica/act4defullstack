/**
 * src/routes/authRoutes.js
 * Rutas públicas de autenticación.
 */
const express = require("express");
const { register, login, logout, listLogins } = require("../controllers/authController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

// POST /auth/register
router.post("/register", register);

// POST /auth/login
router.post("/login", login);
router.post("/logout", auth, logout);
router.get("/logins", listLogins);

module.exports = router;
