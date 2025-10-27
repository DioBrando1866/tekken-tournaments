import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import tournamentRoutes from "./routes/tournaments.js";

// 🧩 Configurar ruta correcta del archivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "server.env") }); // 👈 nombre correcto

console.log("📁 Cargando .env desde:", path.join(__dirname, "server.env"));
console.log("🔍 MONGO_URI:", process.env.MONGO_URI);

const app = express();
app.use(cors());
app.use(express.json());

// 🧩 Rutas
app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);

// 🧩 Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));

// 🧩 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor Express corriendo en puerto ${PORT}`)
);
