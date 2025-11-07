import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./apiSupabase";
import { AnimatedBackground } from "./App";
import BracketScreen from "./BracketScreen";
import TournamentDetailScreen from "./TournamentDetailScreen";
import TournamentDetailWithBracket from "./TournamentDetailWithBracket";

export default function TournamentModule({ goBack }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [selectedTournamentWithBracket, setSelectedTournamentWithBracket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // 🔹 Obtener usuario actual
  async function fetchUser() {
    const { data, error } = await supabase.auth.getUser();
    if (!error) setCurrentUser(data.user);
  }

  // 🔹 Obtener lista de torneos
  async function fetchTournaments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: true });
      if (!error) setTournaments(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
    fetchTournaments();
  }, []);

  // 🔹 Eliminar torneo
  async function deleteTournament() {
    if (!selectedId) return;
    const { error } = await supabase.from("tournaments").delete().eq("id", selectedId);
    if (!error) {
      setShowModal(false);
      fetchTournaments();
    }
  }

  // 🔹 Mostrar detalle clásico
  if (selectedTournament) {
    return (
      <TournamentDetailScreen
        tournament={selectedTournament}
        goBack={() => setSelectedTournament(null)}
      />
    );
  }

  // 🔹 Mostrar bracket antiguo
  if (selectedBracket) {
    return (
      <BracketScreen
        tournament={selectedBracket}
        goBack={() => setSelectedBracket(null)}
      />
    );
  }

  // 🔹 Mostrar bracket con líneas (nuevo)
  if (selectedTournamentWithBracket) {
    return (
      <TournamentDetailWithBracket
        tournament={selectedTournamentWithBracket}
        goBack={() => setSelectedTournamentWithBracket(null)}
      />
    );
  }

  // 🔹 Mostrar carga
  if (loading)
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <AnimatedBackground />
        <ActivityIndicator size="large" color="#e43b3b" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Cargando torneos...</Text>
      </SafeAreaView>
    );

  // 🔹 Pantalla principal
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
            renderItem={({ item }) => {
              const isCreator = currentUser?.id === item.creator_id;
              return (
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardText}>📅 {item.date}</Text>
                    <Text style={styles.creatorText}>
                      👤 Creado por: {item.creator_name || "Usuario desconocido"}
                    </Text>
                  </View>

                  {/* 🔹 Ver detalle */}
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => setSelectedTournament(item)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>🔍</Text>
                  </TouchableOpacity>

                  {/* 🔹 Ver bracket visual */}
                  <TouchableOpacity
                    style={styles.bracketButton}
                    onPress={() => setSelectedTournamentWithBracket(item)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>🏆</Text>
                  </TouchableOpacity>

                  {/* 🔹 Eliminar si es el creador */}
                  {isCreator && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        setSelectedId(item.id);
                        setShowModal(true);
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        )}

        {/* 🔹 Botón de volver */}
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Modal de confirmación */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Eliminar torneo?</Text>
            <Text style={styles.modalText}>Esta acción no se puede deshacer.</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[styles.modalBtn, { backgroundColor: "#555" }]}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={deleteTournament}
                style={[styles.modalBtn, { backgroundColor: "#e43b3b" }]}
              >
                <Text style={styles.modalBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- 🎨 Estilos ----------
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
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  cardText: { fontSize: 14, color: "#bbb", marginTop: 4 },
  creatorText: { fontSize: 13, color: "#888", marginTop: 6, fontStyle: "italic" },
  detailButton: {
    backgroundColor: "#555",
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  bracketButton: {
    backgroundColor: "#e43b3b",
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#b00000",
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 20,
  },
  backText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalBox: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
    width: 280,
    alignItems: "center",
    borderColor: "#e43b3b55",
    borderWidth: 1,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "bold" },
});
