import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function LoginScreen({ goToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password)
      return Alert.alert("Campos vacíos", "Introduce correo y contraseña.");

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("❌ Login error:", error.message);
      return Alert.alert("Error", "Usuario o contraseña incorrectos");
    }

    await AsyncStorage.setItem("token", data.session.access_token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));

    onLoginSuccess(data.user);
  }

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground />
      <Image
        source={require("./assets/images/tekken-logo.png")}
        style={{ width: 180, height: 70, resizeMode: "contain", marginBottom: 20 }}
      />
      <Text style={styles.title}>Iniciar Sesión</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goToRegister}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
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
