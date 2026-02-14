/**
 * src/app.js
 * Configuración central de Express:
 * - Middlewares globales (cors, json, static)
 * - Rutas (auth, products)
 * - Manejador de errores
 */
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

// Permite CORS (útil si tu front corre en otro origen)
app.use(cors());

// Permite leer JSON en el body
app.use(express.json());

// Sirve archivos estáticos del front (login y panel)
app.use(express.static(path.join(__dirname, "..", "public")));

// Rutas API
app.use("/auth", authRoutes);
app.use("/products", productRoutes);

// Healthcheck simple
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "UP" });
});

// Middleware de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
