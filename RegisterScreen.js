import React, { useState } from "react";
import {
    Alert,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { supabase } from "./apiSupabase";
import { AnimatedBackground } from "./App";

export default function RegisterScreen({ goToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password)
      return Alert.alert("Campos vacíos", "Introduce correo y contraseña.");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      console.error("❌ Error registro:", error.message);
      return Alert.alert("Error", error.message);
    }

    Alert.alert(
      "✅ Registro exitoso",
      "Revisa tu correo para confirmar la cuenta antes de iniciar sesión."
    );
    goToLogin();
  }

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground />
      <Image
        source={require("./assets/images/tekken-logo.png")}
        style={{ width: 180, height: 70, resizeMode: "contain", marginBottom: 20 }}
      />
      <Text style={styles.title}>Registro</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#888"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Registrando..." : "Registrarse"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goToLogin}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0b0b0b" },
  title: { color: "#ff4040", fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e43b3b55",
    marginVertical: 10,
    width: 260,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#e43b3b",
    paddingVertical: 14,
    borderRadius: 10,
    width: 200,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  link: { color: "#ff5050", marginTop: 20, textDecorationLine: "underline" },
});
