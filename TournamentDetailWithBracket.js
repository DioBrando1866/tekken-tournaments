import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./apiSupabase";
import { AnimatedBackground } from "./App";

export default function TournamentBracket({ tournament, goBack }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [matchPlayers, setMatchPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [flashStates, setFlashStates] = useState({});

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("tournament_id", tournament.id);
    if (!error && data) setPlayers(data);
  }

  async function fetchMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select("*, p1:player1_id(name), p2:player2_id(name)")
      .eq("tournament_id", tournament.id);
    if (!error && data) setMatches(data);
  }

  function triggerFlash(id) {
    setFlashStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setFlashStates(prev => ({ ...prev, [id]: false })), 400);
  }

  function toggleSelectPlayer(player) {
    setSelectedPlayers(prev => {
      if (prev.find(p => p.id === player.id)) {
        return prev.filter(p => p.id !== player.id);
      } else {
        return [...prev, player].slice(-2);
      }
    });
  }

  useEffect(() => {
    if (selectedPlayers.length === 2) {
      setMatchPlayers(selectedPlayers);
      setModalVisible(true);
    }
  }, [selectedPlayers]);

  async function confirmMatch(maxScore) {
    const [p1, p2] = matchPlayers;
    try {
      const { error } = await supabase.from("matches").insert([
        {
          tournament_id: tournament.id,
          player1_id: p1.id,
          player2_id: p2.id,
          winner_id: null,
          round: 1,
          max_score: maxScore,
          player1_score: 0,
          player2_score: 0,
        },
      ]);
      if (error) throw error;
      triggerFlash(p1.id);
      triggerFlash(p2.id);
      fetchMatches();
    } catch {
      Alert.alert("Error", "No se pudo crear el enfrentamiento");
    }
    setModalVisible(false);
    setSelectedPlayers([]);
  }

  async function updateScore(match, playerId) {
    let playerField = playerId === match.player1_id ? "player1_score" : "player2_score";
    const newScore = (match[playerField] || 0) + 1;
    const updates = { [playerField]: newScore };
    if (newScore >= match.max_score) {
      updates.winner_id = playerId;
      // Verifica si todos los enfrentamientos de la ronda han terminado
      await createNextRound(match.round);
    }
    const { error } = await supabase.from("matches").update(updates).eq("id", match.id);
    if (!error) fetchMatches();
    triggerFlash(playerId);
  }

  async function createNextRound(currentRound) {
    // Verifica si todos los enfrentamientos de la ronda están resueltos
    const incompleteMatches = await supabase
      .from("matches")
      .select("id, winner_id")
      .eq("round", currentRound)
      .is("winner_id", null);
      
    if (incompleteMatches.data.length > 0) return; // Si hay enfrentamientos sin resolución, no crear la siguiente ronda

    // Obtén los ganadores de la ronda actual
    const winners = await supabase
      .from("matches")
      .select("winner_id")
      .eq("round", currentRound)
      .not("winner_id", "is", null);

    if (winners.data.length % 2 !== 0) return; // Si no hay suficientes ganadores, no se puede crear la siguiente ronda.

    const pairs = [];
    for (let i = 0; i < winners.data.length; i += 2) {
      pairs.push([winners.data[i].winner_id, winners.data[i + 1].winner_id]);
    }

    // Crear nuevos enfrentamientos para la siguiente ronda
    for (let [player1_id, player2_id] of pairs) {
      await supabase.from("matches").insert([
        {
          tournament_id: tournament.id,
          player1_id,
          player2_id,
          winner_id: null,
          round: currentRound + 1,
          max_score: 3, // Puedes personalizar el máximo de puntuación por ronda
          player1_score: 0,
          player2_score: 0,
        },
      ]);
    }
    fetchMatches();
  }

  async function deleteMatch(id) {
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) Alert.alert("Error", "No se pudo eliminar el enfrentamiento");
    else fetchMatches();
  }

  async function addPlayer() {
    if (!newPlayerName.trim()) return;
    try {
      const { error } = await supabase.from("players").insert([
        { name: newPlayerName.trim(), tournament_id: tournament.id, is_winner: false },
      ]);
      if (error) throw error;
      setNewPlayerName("");
      fetchPlayers();
    } catch {
      Alert.alert("Error", "No se pudo añadir el jugador");
    }
  }

  // Filtrar jugadores libres (no asignados a ningún match)
  const freePlayers = players.filter(
    p => !matches.some(m => m.player1_id === p.id || m.player2_id === p.id)
  );

  // Organizar matches por ronda
  const organizeByRound = matches => {
    const rounds = {};
    matches.forEach(match => {
      if (!rounds[match.round]) rounds[match.round] = [];
      rounds[match.round].push(match);
    });
    return Object.keys(rounds)
      .sort((a, b) => a - b)
      .map(r => rounds[r]);
  };

  const MatchBlock = ({ match, height }) => (
    <View style={{ marginVertical: height / 4, alignItems: "center" }}>
      <TouchableOpacity
        onPress={() => updateScore(match, match.player1_id)}
        disabled={match.winner_id !== null}
      >
        <Text style={[styles.matchPlayer, match.winner_id === match.player1_id && styles.winnerText]}>
          {match.p1?.name || "??"} ({match.player1_score})
        </Text>
      </TouchableOpacity>

      <View style={[styles.horizontalConnector, { height }]} />

      <TouchableOpacity
        onPress={() => updateScore(match, match.player2_id)}
        disabled={match.winner_id !== null}
      >
        <Text style={[styles.matchPlayer, match.winner_id === match.player2_id && styles.winnerText]}>
          {match.p2?.name || "??"} ({match.player2_score})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Bracket = ({ matches }) => {
    const rounds = organizeByRound(matches);
    const baseHeight = 60;

    return (
      <ScrollView horizontal contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {rounds.map((round, i) => (
            <View key={i} style={{ marginHorizontal: 40, alignItems: "center" }}>
              <Text style={styles.roundTitle}>Round {i + 1}</Text>
              {round.map(match => (
                <View key={match.id} style={{ position: "relative" }}>
                  <MatchBlock match={match} height={baseHeight * Math.pow(2, i)} />
                  {i < rounds.length - 1 && match.winner_id && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 100,
                        width: 40,
                        height: baseHeight * Math.pow(2, i),
                        borderTopWidth: 2,
                        borderColor: "#ff4040",
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground />
      <Text style={styles.title}>{tournament.name}</Text>
      <Text style={styles.subtitle}>Añade jugadores y selecciona dos para crear un enfrentamiento</Text>

      <View style={styles.addPlayerContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del jugador"
          placeholderTextColor="#888"
          value={newPlayerName}
          onChangeText={setNewPlayerName}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addPlayer}>
          <Text style={{ color: "#fff" }}>Añadir</Text>
        </TouchableOpacity>
      </View>

      {/* Jugadores libres */}
      <ScrollView horizontal style={{ marginBottom: 20 }}>
        {freePlayers.map(player => (
          <TouchableOpacity
            key={player.id}
            style={[
              styles.freePlayerCard,
              flashStates[player.id] ? { backgroundColor: "#ffff70" } : {},
            ]}
            onPress={() => toggleSelectPlayer(player)}
          >
            <Text style={styles.playerName}>{player.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.subtitle}>Bracket Visual</Text>
      {matches.length === 0 ? (
        <Text style={{ color: "#888", textAlign: "center" }}>No hay enfrentamientos aún.</Text>
      ) : (
        <Bracket matches={matches} />
      )}

      {/* Modal de tipo de match */}
      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecciona tipo de enfrentamiento</Text>
            <TouchableOpacity onPress={() => confirmMatch(2)}><Text style={styles.modalOption}>Best of 3</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => confirmMatch(3)}><Text style={styles.modalOption}>Best of 5</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => confirmMatch(5)}><Text style={styles.modalOption}>First to 5</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.modalCancel}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  title: { color: "#ff4040", fontSize: 26, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
  subtitle: { color: "#aaa", fontSize: 14, textAlign: "center", marginBottom: 10 },
  addPlayerContainer: { flexDirection: "row", paddingHorizontal: 10, marginBottom: 12 },
  input: { flex: 1, backgroundColor: "#222", color: "#fff", padding: 8, borderRadius: 8, marginRight: 10 },
  addBtn: { backgroundColor: "#e43b3b", padding: 8, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  playerCard: { backgroundColor: "#222", borderColor: "#e43b3b", borderWidth: 1, borderRadius: 12, padding: 10, marginHorizontal: 6, alignItems: "center", justifyContent: "center" },
  freePlayerCard: { backgroundColor: "#222", borderColor: "#e43b3b", borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, marginHorizontal: 6, alignItems: "center", justifyContent: "center", height: 50, minWidth: 80 },
  playerName: { color: "#fff", fontSize: 14 },
  matchPlayer: { color: "#fff", fontSize: 14, marginVertical: 2, textAlign: "center" },
  winnerText: { color: "#ffd700", fontWeight: "bold" },
  horizontalConnector: { width: 40, backgroundColor: "#ff4040", marginVertical: 2 },
  roundTitle: { color: "#ff4040", fontWeight: "bold", marginBottom: 10, fontSize: 16, textAlign: "center" },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { backgroundColor: "#222", padding: 20, borderRadius: 12, minWidth: 250 },
  modalTitle: { color: "#fff", fontSize: 16, marginBottom: 10 },
  modalOption: { color: "#ff4040", marginVertical: 6 },
  modalCancel: { color: "#888", marginTop: 10 },
  backButton: { backgroundColor: "#333", padding: 12, borderRadius: 10, alignSelf: "center", marginTop: 20 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
