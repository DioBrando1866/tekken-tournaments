import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./apiSupabase";

export default function TournamentDetailScreen({ tournament, goBack }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  // 🛡 STATE PARA PROTEGER EL TORNEO
  const [needsPassword, setNeedsPassword] = useState(!tournament.is_public);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordModalVisible, setPasswordModalVisible] = useState(!tournament.is_public);

  // ================================
  // 🔐 VALIDAR CONTRASEÑA PRIVADA
  // ================================
  function checkPassword() {
    if (passwordInput === tournament.password) {
      setNeedsPassword(false);
      setPasswordModalVisible(false);
    } else {
      Alert.alert("Error", "Contraseña incorrecta");
      setPasswordInput("");
    }
  }

  // ================================
  // 📥 FETCH PLAYERS
  // ================================
  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("tournament_id", tournament.id);

    if (!error) setPlayers(data);
  }

  // 📥 FETCH MATCHES
  async function fetchMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournament.id);

    if (!error) setMatches(data);
  }

  useEffect(() => {
    if (!needsPassword) {
      fetchPlayers();
      fetchMatches();
    }
  }, [needsPassword]);

  // ================================
  // ❌ ELIMINAR JUGADOR
  // ================================
  async function deletePlayer(playerId) {
    try {
      const { error } = await supabase.from("players").delete().eq("id", playerId);
      if (error) {
        if (error.code === "23503") {
          Alert.alert(
            "No se puede eliminar",
            "Este jugador está en un enfrentamiento. Elimínalo primero del match."
          );
        } else throw error;
      } else {
        Alert.alert("Jugador eliminado correctamente.");
        fetchPlayers();
      }
    } catch (err) {
      console.error("Error al eliminar jugador:", err);
    }
  }

  // ❌ ELIMINAR SOLO DEL MATCH
  async function removePlayerFromMatch(matchId, playerSlot) {
    const field = playerSlot === 1 ? "player1_id" : "player2_id";

    const { error } = await supabase
      .from("matches")
      .update({ [field]: null })
      .eq("id", matchId);

    if (error) {
      Alert.alert("Error", "No se pudo eliminar del enfrentamiento.");
    } else {
      fetchMatches();
    }
  }

  // No mostramos nada hasta que verifique la contraseña
  if (needsPassword) {
    return (
      <Modal animationType="fade" transparent visible={passwordModalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🔒 Torneo privado</Text>
            <Text style={styles.modalSubtitle}>Introduce la contraseña para acceder</Text>

            <TextInput
              secureTextEntry
              style={styles.modalInput}
              placeholder="Contraseña..."
              placeholderTextColor="#888"
              value={passwordInput}
              onChangeText={setPasswordInput}
            />

            <TouchableOpacity style={styles.modalBtn} onPress={checkPassword}>
              <Text style={styles.modalBtnText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setPasswordModalVisible(false);
                goBack();
              }}
            >
              <Text style={{ color: "#aaa" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ================================
  // 🎨 CONTENIDO NORMAL UNA VEZ DENTRO
  // ================================
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏆 {tournament.name}</Text>

      <Text style={styles.detailText}>
        Descripción: {tournament.description || "Sin descripción"}
      </Text>
      <Text style={styles.detailText}>
        Tipo:{" "}
        {tournament.tournament_type
          ? tournament.tournament_type.replace("_", " ")
          : "Tipo desconocido"}
      </Text>
      <Text style={styles.detailText}>Rondas por enfrentamiento: {tournament.rounds}</Text>
      <Text style={styles.detailText}>Tiempo por partida: {tournament.match_time}s</Text>
      <Text style={styles.detailText}>
        Privacidad: {tournament.is_public ? "Público" : "Privado"}
      </Text>
      <Text style={styles.detailText}>Máximo de jugadores: {tournament.max_players}</Text>
      <Text style={[styles.colorBox, { backgroundColor: tournament.color }]} />

      <Text style={styles.subtitle}>Jugadores ({players.length})</Text>

      {players.map((p) => (
        <View key={p.id} style={styles.playerCard}>
          <Text style={{ color: "#fff" }}>{p.name}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePlayer(p.id)}>
            <Text style={{ color: "#fff" }}>🗑</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.subtitle, { marginTop: 20 }]}>Enfrentamientos</Text>

      {matches.length === 0 ? (
        <Text style={{ color: "#aaa", textAlign: "center" }}>No hay enfrentamientos aún.</Text>
      ) : (
        matches.map((m) => {
          const p1 = players.find((p) => p.id === m.player1_id);
          const p2 = players.find((p) => p.id === m.player2_id);

          return (
            <View key={m.id} style={styles.matchCard}>
              <View style={styles.matchSide}>
                <Text style={styles.playerName}>{p1?.name || "Vacante"}</Text>
                {p1 && (
                  <TouchableOpacity
                    style={styles.smallDelete}
                    onPress={() => removePlayerFromMatch(m.id, 1)}
                  >
                    <Text style={{ color: "#fff" }}>❌</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.vsText}>VS</Text>

              <View style={styles.matchSide}>
                <Text style={styles.playerName}>{p2?.name || "Vacante"}</Text>
                {p2 && (
                  <TouchableOpacity
                    style={styles.smallDelete}
                    onPress={() => removePlayerFromMatch(m.id, 2)}
                  >
                    <Text style={{ color: "#fff" }}>❌</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}

      <TouchableOpacity onPress={goBack} style={styles.backBtn}>
        <Text style={styles.backText}>⬅ Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============================================================
// 🎨 ESTILOS (COMPLETOS)
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b", padding: 16 },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ff4040",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  playerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 8,
    borderColor: "#e43b3b55",
    borderWidth: 1,
    marginBottom: 8,
  },
  deleteBtn: {
    backgroundColor: "#e43b3b",
    borderRadius: 6,
    padding: 6,
  },
  matchCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    borderColor: "#e43b3b55",
    borderWidth: 1,
    marginVertical: 8,
  },
  matchSide: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: { color: "#fff", fontSize: 16 },
  smallDelete: {
    backgroundColor: "#e43b3b",
    borderRadius: 6,
    padding: 4,
    marginLeft: 6,
  },
  vsText: {
    color: "#ff4040",
    fontWeight: "900",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 4,
  },
  backBtn: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: "center",
  },
  backText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  detailText: { color: "#ccc", fontSize: 14, marginBottom: 4 },
  colorBox: {
    width: 50,
    height: 20,
    borderRadius: 4,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#fff",
  },

  // ================== MODAL PRIVADO ==================
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    borderWidth: 1,
    borderColor: "#ff4040",
  },
  modalTitle: {
    color: "#ff4040",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalSubtitle: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  modalBtn: {
    backgroundColor: "#ff4040",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "bold" },
  modalCancel: {
    marginTop: 10,
    alignItems: "center",
  },
});
