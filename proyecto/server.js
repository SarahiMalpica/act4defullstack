require("dotenv").config();

const { connectDB } = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;
let dbPromise = null;

function ensureDb() {
  if (!dbPromise) {
    dbPromise = connectDB(process.env.MONGO_URI);
  }
  return dbPromise;
}

if (require.main === module) {
  ensureDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Error al iniciar:", err);
      process.exit(1);
    });
}

module.exports = async (req, res) => {
  await ensureDb();
  return app(req, res);
};
