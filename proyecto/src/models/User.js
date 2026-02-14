/**
 * src/models/User.js
 * Modelo de usuario.
 * - usuario: string único
 * - passwordHash: contraseña hasheada (bcrypt)
 */
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    usuario: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
