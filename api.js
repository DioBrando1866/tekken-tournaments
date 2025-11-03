// api.js
import axios from "axios";
import { Platform } from "react-native";

// 🧩 Detecta entorno y usa IP adecuada
const baseURL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5000/api" // ✅ Para Android Studio Emulator
    : "http://localhost:5000/api"; // 💻 Para Web o iOS

const API = axios.create({ baseURL });

// 🔹 Endpoints
export const getTournaments = () => API.get("/tournaments");
export const createTournament = (data) => API.post("/tournaments", data);

export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);

export default API;
