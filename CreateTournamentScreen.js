import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { supabase } from "./apiSupabase";
import { AnimatedBackground } from "./App";

export default function CreateTournamentScreen({ goBack }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Función para obtener el ID y nombre del usuario actual desde Supabase
  async function getUserDetails() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      Alert.alert("Error", "No se encontró sesión activa.");
      return null;
    }
    return { userId: session.user.id, userName: session.user.username }; // Puedes cambiar email por el nombre si lo tienes
  }

  async function createTournament() {
    if (!name.trim() || !date.trim()) {
      return Alert.alert("Campos vacíos", "Por favor completa todos los campos.");
    }

    const userDetails = await getUserDetails(); // ✅ esta sí existe
if (!userDetails) return;

const { userId } = userDetails;


    // Obtener el nombre de usuario del creador
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      Alert.alert("Error", "No se pudo obtener el nombre de usuario.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .insert([{ name, date, creator_id: userId, creator_name: userData.username }]); // Incluir el creator_name

      if (error) throw error;

      Alert.alert("✅ Torneo creado", "El torneo se ha registrado correctamente.");
      goBack();
    } catch (err) {
      console.error("❌ Error creando torneo:", err);
      Alert.alert("Error", err.message || "No se pudo crear el torneo");
    } finally {
      setLoading(false);
    }
}


  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.authContainer}>
        <Image
          source={require("./assets/images/tekken-logo.png")}
          style={{ width: 180, height: 70, resizeMode: "contain", marginBottom: 10 }}
        />
        <Text style={styles.bigTitle}>CREAR TORNEO</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre del Torneo"
          placeholderTextColor="#888"
          onChangeText={setName}
          value={name}
        />
        <TextInput
          style={styles.input}
          placeholder="Fecha (YYYY-MM-DD)"
          placeholderTextColor="#888"
          onChangeText={setDate}
          value={date}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={createTournament}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creando..." : "Guardar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goBack}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  bigTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ff4040",
    textAlign: "center",
    textShadowColor: "#ff0000",
    textShadowRadius: 20,
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#e43b3b",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 10,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16, textAlign: "center" },
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
  authContainer: { justifyContent: "center", alignItems: "center", padding: 24 },
  link: { color: "#ff5050", marginTop: 12, fontSize: 14, textDecorationLine: "underline" },
});
