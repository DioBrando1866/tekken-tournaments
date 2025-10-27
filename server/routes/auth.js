import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// ---------- Registro ----------
router.post("/register", async (req, res) => {
  console.log("📩 Datos recibidos en /auth/register:", req.body);

  try {
    const { username, password } = req.body;

    // Validación
    if (!username || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Comprobar si ya existe
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Encriptar contraseña
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashed });
    await newUser.save();

    // Generar token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("✅ Usuario registrado correctamente:", newUser.username);
    res.json({ user: { username: newUser.username }, token });
  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});


// ---------- Login ----------
router.post("/login", async (req, res) => {
  console.log("📩 Datos recibidos en /auth/login:", req.body);

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Faltan usuario o contraseña" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log("❌ Usuario no encontrado:", username);
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Contraseña incorrecta para usuario:", username);
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("✅ Login correcto para usuario:", username);
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error("🔥 Error inesperado en /auth/login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
