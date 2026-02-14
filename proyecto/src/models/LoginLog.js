/**
 * src/models/LoginLog.js
 * Log de inicios de sesion.
 * - usuario: string
 */
const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema(
  {
    usuario: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginLog", loginLogSchema);
