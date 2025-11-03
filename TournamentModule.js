import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./apiSupabase";
import { AnimatedBackground } from "./App";

export default function TournamentModule({ goBack }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchTournaments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setTournaments(data || []);
    } catch (err) {
      console.error("❌ Error obteniendo torneos:", err);
      Alert.alert("Error", "No se pudieron cargar los torneos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function deleteTournament(id) {
    Alert.alert(
      "Eliminar Torneo",
      "¿Estás seguro de que quieres eliminar este torneo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("tournaments")
                .delete()
                .eq("id", id);

              if (error) throw error;
              fetchTournaments(); // recarga
            } catch (err) {
              Alert.alert("Error", "No se pudo eliminar el torneo");
            }
          },
        },
      ]
    );
  }

  if (loading)
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <AnimatedBackground />
        <ActivityIndicator size="large" color="#e43b3b" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Cargando torneos...</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground />
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={styles.bigTitle}>TORNEOS REGISTRADOS</Text>

        {tournaments.length === 0 ? (
          <Text style={{ color: "#aaa", textAlign: "center", marginTop: 20 }}>
            No hay torneos registrados.
          </Text>
        ) : (
          <FlatList
            data={tournaments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardText}>📅 {item.date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTournament(item.id)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 💄 Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  center: { justifyContent: "center", alignItems: "center" },
  bigTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ff4040",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "#ff0000",
    textShadowRadius: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e43b3b33",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  cardText: { fontSize: 14, color: "#bbb", marginTop: 4 },
  deleteButton: {
    backgroundColor: "#e43b3b",
    borderRadius: 8,
    padding: 8,
    marginLeft: 12,
  },
  backButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 20,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
