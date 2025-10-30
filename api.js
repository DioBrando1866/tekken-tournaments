// api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getTournaments = () => API.get("/tournaments");
export const createTournament = (data) => API.post("/tournaments", data);

export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);

export default API;
