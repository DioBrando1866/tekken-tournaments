import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "http://10.112.4.208:5000/api/tournaments"; // ⚙️ Cambia si tu IP cambia

export default function TournamentModule({ goBack, mode = "view" }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [newTName, setNewTName] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Obtener torneos desde el backend
  async function fetchTournaments() {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setTournaments(res.data);
    } catch (err) {
      console.error("Error obteniendo torneos:", err.message);
      Alert.alert("Error al obtener torneos del servidor");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Crear nuevo torneo
  async function createTournament() {
    if (!newTName.trim()) {
      Alert.alert("Debes escribir un nombre para el torneo");
      return;
    }
    try {
      const res = await axios.post(API_URL, {
        name: newTName.trim(),
        date: new Date().toISOString().split("T")[0],
        location: "Madrid",
      });
      setTournaments((prev) => [res.data, ...prev]);
      setSelectedTournament(res.data);
      setNewTName("");
    } catch (err) {
      console.error("Error al crear torneo:", err.message);
      Alert.alert("Error al crear torneo");
    }
  }

  // 🔹 Actualizar torneo (jugadores o rounds)
  async function updateTournament(id, patch) {
    try {
      const res = await axios.put(`${API_URL}/${id}`, patch);
      setTournaments((prev) =>
        prev.map((t) => (t._id === id ? res.data : t))
      );
      setSelectedTournament(res.data);
    } catch (err) {
      console.error("Error al actualizar torneo:", err.message);
    }
  }

  // 🔹 Añadir jugador
  function addPlayer() {
    if (!newPlayer.trim()) {
      Alert.alert("Introduce un nombre de jugador");
      return;
    }
    const updatedPlayers = [
      ...(selectedTournament.players || []),
      { id: Date.now().toString(), name: newPlayer.trim() },
    ];
    updateTournament(selectedTournament._id, { players: updatedPlayers });
    setNewPlayer("");
  }

  // 🔹 Generar enfrentamientos (bracket simple)
  function generateBracket() {
    const players = [...selectedTournament.players];
    if (players.length < 2) {
      Alert.alert("Se necesitan al menos 2 jugadores");
      return;
    }

    const shuffled = players.sort(() => Math.random() - 0.5);
    const round = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      const p1 = shuffled[i];
      const p2 = shuffled[i + 1];
      if (p2)
        round.push({
          id: Date.now().toString() + i,
          p1: p1.name,
          p2: p2.name,
          winnerId: null,
        });
    }

    const updatedRounds = [round];
    updateTournament(selectedTournament._id, { rounds: updatedRounds });
  }

  useEffect(() => {
    fetchTournaments();
  }, []);

  // 🏆 Vista de detalle de un torneo
  const renderTournamentDetail = () => (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0b0b0b", padding: 16 }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: "#fff",
          marginBottom: 10,
        }}
      >
        {selectedTournament.name}
      </Text>

      <Text style={{ color: "#bbb", marginBottom: 5 }}>
        📅 Fecha: {selectedTournament.date}
      </Text>
      <Text style={{ color: "#bbb", marginBottom: 20 }}>
        📍 Lugar: {selectedTournament.location}
      </Text>

      {/* Jugadores */}
      <Text style={{ color: "#fff", fontSize: 18, marginBottom: 5 }}>
        Jugadores:
      </Text>
      {selectedTournament.players?.length > 0 ? (
        selectedTournament.players.map((p) => (
          <Text key={p.id} style={{ color: "#ccc", marginVertical: 2 }}>
            • {p.name}
          </Text>
        ))
      ) : (
        <Text style={{ color: "#555" }}>No hay jugadores aún.</Text>
      )}

      {/* Añadir jugador */}
      <View
        style={{
          flexDirection: "row",
          marginTop: 15,
          marginBottom: 20,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: "#222",
            color: "#fff",
            borderRadius: 8,
            padding: 8,
          }}
          placeholder="Nuevo jugador"
          placeholderTextColor="#666"
          value={newPlayer}
          onChangeText={setNewPlayer}
        />
        <TouchableOpacity
          onPress={addPlayer}
          style={{
            backgroundColor: "#e91e63",
            marginLeft: 10,
            borderRadius: 8,
            justifyContent: "center",
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Añadir</Text>
        </TouchableOpacity>
      </View>

      {/* Bracket */}
      <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
        Enfrentamientos:
      </Text>
      {selectedTournament.rounds?.length > 0 ? (
        selectedTournament.rounds.map((round, ri) => (
          <View
            key={ri}
            style={{
              backgroundColor: "#111",
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: "#e91e63",
                fontWeight: "bold",
                marginBottom: 5,
              }}
            >
              Ronda {ri + 1}
            </Text>
            {round.map((match) => (
              <Text key={match.id} style={{ color: "#ccc" }}>
                {match.p1} vs {match.p2}
              </Text>
            ))}
          </View>
        ))
      ) : (
        <Text style={{ color: "#555" }}>No se ha generado ningún bracket.</Text>
      )}

      <TouchableOpacity
        onPress={generateBracket}
        style={{
          backgroundColor: "#2196f3",
          padding: 12,
          borderRadius: 8,
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          Generar Bracket
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setSelectedTournament(null)}
        style={{
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#aaa" }}>← Volver a la lista</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 🏁 Lista de torneos
  const renderTournamentList = () => (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0b0b0b",
        padding: 16,
        paddingTop: 40,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          color: "#fff",
          fontWeight: "bold",
          marginBottom: 15,
        }}
      >
        Torneos
      </Text>

      {mode === "create" && (
        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: "#222",
              color: "#fff",
              borderRadius: 8,
              padding: 10,
            }}
            placeholder="Nombre del nuevo torneo"
            placeholderTextColor="#666"
            value={newTName}
            onChangeText={setNewTName}
          />
          <TouchableOpacity
            onPress={createTournament}
            style={{
              backgroundColor: "#e91e63",
              paddingHorizontal: 12,
              marginLeft: 10,
              borderRadius: 8,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Crear</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={tournaments}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={fetchTournaments}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedTournament(item)}
            style={{
              backgroundColor: "#111",
              borderRadius: 10,
              padding: 15,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18 }}>{item.name}</Text>
            <Text style={{ color: "#888" }}>{item.location}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        onPress={goBack}
        style={{ alignItems: "center", marginTop: 10 }}
      >
        <Text style={{ color: "#aaa" }}>← Volver</Text>
      </TouchableOpacity>
    </View>
  );

  if (selectedTournament) return renderTournamentDetail();
  return renderTournamentList();
}
