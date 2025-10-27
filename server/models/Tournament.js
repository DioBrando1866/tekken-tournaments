// server/models/Tournament.js
import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  id: String,
  name: String,
});

const matchSchema = new mongoose.Schema({
  id: String,
  p1: String,
  p2: String,
  winnerId: String,
});

// models/Tournament.js
const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: false }, // 👈 ahora no obligatorio
  location: { type: String, required: false },
  players: { type: Array, default: [] },
  rounds: { type: Array, default: [] },
});


export default mongoose.model("Tournament", tournamentSchema);
