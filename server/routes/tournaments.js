// routes/tournaments.js
import express from "express";
import Tournament from "../models/Tournament.js";

const router = express.Router();

// Obtener todos los torneos
router.get("/", async (req, res) => {
  try {
    const tournaments = await Tournament.find();
    res.json(tournaments);
  } catch (error) {
    console.error("❌ Error obteniendo torneos:", error);
    res.status(500).json({ message: "Error obteniendo torneos" });
  }
});

// Crear torneo
router.post("/", async (req, res) => {
  try {
    console.log("📩 Datos recibidos:", req.body);

    const { name, date, location, players } = req.body;

    // Solo validar el nombre, ya que los otros campos son opcionales
    if (!name) {
      return res.status(400).json({ message: "El nombre del torneo es obligatorio" });
    }

    const newTournament = new Tournament({
      name,
      date: date || new Date().toISOString().split("T")[0],  // Fecha actual por defecto
      location: location || "Ubicación no especificada",    // Ubicación por defecto
      players: players || [],
    });

    const saved = await newTournament.save();
    console.log("✅ Torneo guardado:", saved);
    res.status(201).json(saved);
  } catch (error) {
    console.error("❌ Error creando torneo:", error);
    res.status(500).json({ message: "Error creando torneo", error });
  }
});

// Actualizar torneo
router.put("/:id", async (req, res) => {
  try {
    const updated = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    console.error("❌ Error actualizando torneo:", error);
    res.status(500).json({ message: "Error actualizando torneo" });
  }
});

export default router;
