import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { register } from "./authSupabase";

export default function RegisterScreen({ goToLogin }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    try {
      await register(email, password, username);
      alert("Cuenta creada correctamente. Ahora inicia sesión.");
      goToLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrarse</Text>

      <TextInput
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Nombre de usuario"
        placeholderTextColor="#888"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        placeholder="Contraseña"
        placeholderTextColor="#888"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goToLogin}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b", justifyContent: "center", alignItems: "center" },
  title: { color: "#fff", fontSize: 28, marginBottom: 20 },
  input: { width: 250, backgroundColor: "#111", color: "#fff", padding: 12, borderRadius: 8, marginBottom: 10 },
  button: { backgroundColor: "#e43b3b", padding: 14, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "700" },
  link: { color: "#ff5050", marginTop: 12 },
  error: { color: "#ff4040", marginBottom: 10 },
});
