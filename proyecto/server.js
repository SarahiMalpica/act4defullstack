require("dotenv").config();

const http = require("http");
const { connectDB } = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

async function start() {
  console.log("Iniciando servidor...");

  await connectDB(process.env.MONGO_URI);

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error al iniciar:", err);
  process.exit(1);
});
