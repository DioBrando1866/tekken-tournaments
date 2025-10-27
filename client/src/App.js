import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Cargando...");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then(res => {
        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        return res.json();
      })
      .then(data => setMessage(data.message))
      .catch(err => {
        console.error("❌ Error de conexión:", err);
        setMessage("Error conectando con el servidor 😢");
      });
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>{message}</h1>
    </div>
  );
}

export default App;
