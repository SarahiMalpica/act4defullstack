/**
 * src/config/db.js
 * Conexión a MongoDB con Mongoose.
 */
const mongoose = require("mongoose");

async function connectDB(uri) {
  if (!uri) throw new Error("MONGO_URI no está definido.");

  // Nota: Mongoose maneja internamente el pool de conexiones.
  await mongoose.connect(uri);
  console.log("MongoDB conectado ✅");
}

module.exports = { connectDB };
