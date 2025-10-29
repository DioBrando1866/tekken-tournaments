// server/routes/user.js
import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Middleware para verificar token JWT
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("❌ Token inválido:", err);
    res.status(403).json({ message: "Token inválido" });
  }
}

// Obtener perfil del usuario autenticado
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Actualizar nombre de usuario
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username)
      return res.status(400).json({ message: "Falta el nombre de usuario" });

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { username },
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("❌ Error actualizando perfil:", error);
    res.status(500).json({ message: "Error actualizando perfil" });
  }
});

// Cambiar contraseña (requiere token y contraseña actual)
router.put("/profile/password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Faltan campos" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Contraseña actual incorrecta" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "✅ Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error cambiando contraseña:", err);
    res.status(500).json({ message: "Error al cambiar la contraseña" });
  }
});

export default router;
