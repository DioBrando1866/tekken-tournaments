// BracketScreen.js
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "./apiSupabase";

export default function BracketScreen({ tournament, goBack }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("tournament_id", tournament.id);
    if (!error) setPlayers(data);
  }

  async function fetchMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select("*, player1:player1_id(name), player2:player2_id(name), winner:winner_id(name)")
      .eq("tournament_id", tournament.id);
    if (!error) setMatches(data);
  }

  async function createMatch() {
    if (!player1 || !player2) return alert("Selecciona dos jugadores");
    try {
      const { error } = await supabase.from("matches").insert([
        {
          tournament_id: tournament.id,
          player1_id: player1,
          player2_id: player2,
        },
      ]);
      if (error) throw error;
      setPlayer1("");
      setPlayer2("");
      fetchMatches();
    } catch (err) {
      console.error("Error creando match:", err);
    }
  }

  async function setWinner(matchId, winnerId) {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ winner_id: winnerId })
        .eq("id", matchId);
      if (error) throw error;
      fetchMatches();
    } catch (err) {
      console.error("Error estableciendo ganador:", err);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bracket - {tournament.name}</Text>

      <View style={styles.selectContainer}>
        <Text style={styles.label}>Jugador 1:</Text>
        <ScrollView horizontal>
          {players.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPlayer1(p.id)}
              style={[
                styles.playerButton,
                player1 === p.id && { backgroundColor: "#e43b3b" },
              ]}
            >
              <Text style={styles.playerText}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Jugador 2:</Text>
        <ScrollView horizontal>
          {players.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPlayer2(p.id)}
              style={[
                styles.playerButton,
                player2 === p.id && { backgroundColor: "#e43b3b" },
              ]}
            >
              <Text style={styles.playerText}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={createMatch}>
          <Text style={styles.addButtonText}>➕ Crear Enfrentamiento</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Enfrentamientos</Text>
      {matches.map((m) => (
        <View key={m.id} style={styles.matchCard}>
          <Text style={styles.matchText}>
            {m.player1?.name || "?"} 🆚 {m.player2?.name || "?"}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.winnerButton}
              onPress={() => setWinner(m.id, m.player1_id)}
            >
              <Text>🏆 {m.player1?.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.winnerButton}
              onPress={() => setWinner(m.id, m.player2_id)}
            >
              <Text>🏆 {m.player2?.name}</Text>
            </TouchableOpacity>
          </View>

          {m.winner && (
            <Text style={styles.winnerText}>🏅 Ganador: {m.winner.name}</Text>
          )}
        </View>
      ))}

      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Text style={styles.backText}>⬅ Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b", padding: 16 },
  title: { fontSize: 24, color: "#ff4040", fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  selectContainer: { marginBottom: 20 },
  label: { color: "#fff", marginVertical: 6 },
  playerButton: {
    borderWidth: 1,
    borderColor: "#e43b3b",
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  playerText: { color: "#fff" },
  addButton: {
    backgroundColor: "#e43b3b",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  sectionTitle: { color: "#fff", fontSize: 18, marginBottom: 8 },
  matchCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#e43b3b",
  },
  matchText: { color: "#fff", fontSize: 16, textAlign: "center" },
  actions: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  winnerButton: {
    backgroundColor: "#333",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  winnerText: {
    color: "#e43b3b",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: "center",
  },
  backText: { color: "#fff" },
});
