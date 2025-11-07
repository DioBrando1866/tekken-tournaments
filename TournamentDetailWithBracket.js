import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { supabase } from "./apiSupabase";
import { AnimatedBackground } from "./App";

const screenWidth = Dimensions.get("window").width;

export default function TournamentDetailWithBracket({ tournament, goBack }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [dropZones, setDropZones] = useState({});
  const [flashStates, setFlashStates] = useState({}); // control de flashes

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("tournament_id", tournament.id);
    if (!error) setPlayers(data || []);
  }

  async function fetchMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select("*, p1:player1_id(name), p2:player2_id(name)")
      .eq("tournament_id", tournament.id);
    if (!error) setMatches(data || []);
  }

  async function createMatch(p1, p2) {
    if (p1.id === p2.id) return;
    try {
      const { error } = await supabase.from("matches").insert([
        {
          tournament_id: tournament.id,
          player1_id: p1.id,
          player2_id: p2.id,
          player1_score: 0,
          player2_score: 0,
        },
      ]);
      if (error) throw error;

      // 🔥 activar flash visual
      triggerFlash(p1.id);
      triggerFlash(p2.id);

      fetchMatches();
    } catch (err) {
      Alert.alert("Error", "No se pudo crear el enfrentamiento");
    }
  }

  async function deleteMatch(id) {
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) Alert.alert("Error", "No se pudo eliminar el enfrentamiento");
    else fetchMatches();
  }

  async function updateScore(match, field, value) {
    const newScore = Math.max(0, value);
    const { error } = await supabase
      .from("matches")
      .update({ [field]: newScore })
      .eq("id", match.id);
    if (!error) fetchMatches();
  }

  // 🔆 flash animado
  function triggerFlash(id) {
    setFlashStates((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setFlashStates((prev) => ({ ...prev, [id]: false }));
    }, 400);
  }

  // ⚙️ Drag & drop visual
  const DraggablePlayer = ({ player }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const isDragging = useSharedValue(false);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isDragging.value ? 1.1 : 1) },
      ],
      opacity: withSpring(isDragging.value ? 0.8 : 1),
      zIndex: isDragging.value ? 100 : 1,
    }));

    const flashAnim = useSharedValue(0);
    useEffect(() => {
      if (flashStates[player.id]) {
        flashAnim.value = 1;
        flashAnim.value = withTiming(0, { duration: 400 });
      }
    }, [flashStates[player.id]]);

    const flashStyle = useAnimatedStyle(() => ({
      backgroundColor:
        flashAnim.value > 0
          ? `rgba(255, 255, 100, ${flashAnim.value})`
          : "transparent",
    }));

    const onGestureEvent = (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    };

    const onHandlerStateChange = (event) => {
      if (event.nativeEvent.state === 4) {
        isDragging.value = false;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        runOnJS(checkDrop)(player, event.nativeEvent.absoluteX, event.nativeEvent.absoluteY);
      } else if (event.nativeEvent.state === 2) {
        isDragging.value = true;
      }
    };

    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          onLayout={(e) => {
            const { x, y, width, height } = e.nativeEvent.layout;
            setDropZones((prev) => ({
              ...prev,
              [player.id]: { x, y, width, height },
            }));
          }}
          style={[styles.playerCard, animatedStyle]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, flashStyle]} />
          <Text style={styles.playerName}>{player.name}</Text>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  function checkDrop(draggedPlayer, dropX, dropY) {
    for (let id in dropZones) {
      const zone = dropZones[id];
      if (
        dropX > zone.x &&
        dropX < zone.x + zone.width &&
        dropY > zone.y &&
        dropY < zone.y + zone.height &&
        id !== draggedPlayer.id
      ) {
        const droppedPlayer = players.find((p) => p.id === id);
        if (droppedPlayer) {
          createMatch(draggedPlayer, droppedPlayer);
        }
        break;
      }
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <AnimatedBackground />
        <Text style={styles.title}>{tournament.name}</Text>
        <Text style={styles.subtitle}>
          Arrastra un jugador sobre otro para crear enfrentamientos
        </Text>

        <View style={styles.playersContainer}>
          {players.map((p) => (
            <DraggablePlayer key={p.id} player={p} />
          ))}
        </View>

        <Text style={styles.subtitle}>Enfrentamientos</Text>
        {matches.length === 0 ? (
          <Text style={{ color: "#888", textAlign: "center" }}>
            No hay enfrentamientos aún.
          </Text>
        ) : (
          matches.map((m) => (
            <View key={m.id} style={styles.matchCard}>
              <View style={styles.matchRow}>
                <Text style={styles.matchPlayer}>{m.p1?.name || "??"}</Text>
                <Text style={styles.vs}>VS</Text>
                <Text style={styles.matchPlayer}>{m.p2?.name || "??"}</Text>
              </View>

              <View style={styles.scoreRow}>
                <TouchableOpacity
                  onPress={() =>
                    updateScore(m, "player1_score", (m.player1_score || 0) + 1)
                  }
                >
                  <Text style={styles.scoreBtn}>+1</Text>
                </TouchableOpacity>
                <Text style={styles.scoreText}>
                  {m.player1_score} - {m.player2_score}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    updateScore(m, "player2_score", (m.player2_score || 0) + 1)
                  }
                >
                  <Text style={styles.scoreBtn}>+1</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteMatch(m.id)}
              >
                <Text style={{ color: "#fff" }}>❌ Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b", padding: 10 },
  title: {
    color: "#ff4040",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  playersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  playerCard: {
    backgroundColor: "#222",
    borderColor: "#e43b3b",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    margin: 6,
    overflow: "hidden",
  },
  playerName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  matchCard: {
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#e43b3b55",
  },
  matchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vs: { color: "#ff4040", fontWeight: "bold", fontSize: 18 },
  matchPlayer: { color: "#fff", fontSize: 16 },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
  },
  scoreBtn: {
    backgroundColor: "#e43b3b",
    padding: 6,
    borderRadius: 8,
    color: "#fff",
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  scoreText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  deleteBtn: {
    backgroundColor: "#b00000",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 20,
  },
  backText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
