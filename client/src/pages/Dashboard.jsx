import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    };
    fetchUser();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      {user ? <p>Bienvenido, {user.username} 👊</p> : <p>Cargando...</p>}
    </div>
  );
}
