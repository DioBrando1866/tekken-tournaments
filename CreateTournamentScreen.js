import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
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

const tournamentColors = ["#ff4040", "#ff9900", "#40ff40", "#4040ff", "#ff40ff"];

export default function CreateTournamentScreen({ goBack }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");

  const [tournamentType, setTournamentType] = useState("eliminacion_simple");
  const [rounds, setRounds] = useState(3);
  const [matchTime, setMatchTime] = useState(60);

  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(16);

  const [color, setColor] = useState(tournamentColors[0]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-100
  const [passwordTips, setPasswordTips] = useState([]);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      Alert.alert("Error", "No se pudo obtener el usuario actual.");
      return;
    }
  
    const userId = authData.user.id;
  
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .single();
  
    if (userError) {
      console.error(userError);
      Alert.alert("Error", "No se pudo obtener el username.");
      return;
    }
  
    setCurrentUser({
      id: userId,
      username: userRow.username
    });
  }

  function handleDateChange(event, selectedDate) {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  }

  function analyzePassword(pw) {
    let strength = 0;
    const tips = [];

    if (pw.length >= 8) strength += 25;
    else tips.push("Añade al menos 8 caracteres");

    if (/[A-Z]/.test(pw)) strength += 25;
    else tips.push("Incluye mayúsculas");

    if (/[0-9]/.test(pw)) strength += 25;
    else tips.push("Incluye números");

    if (/[^A-Za-z0-9]/.test(pw)) strength += 25;
    else tips.push("Incluye símbolos");

    setPasswordStrength(strength);
    setPasswordTips(tips);
  }

  async function createTournament() {
    if (!name.trim()) return Alert.alert("Error", "El torneo debe tener un nombre.");
    if (!currentUser) return Alert.alert("Error", "No se encontró el usuario actual.");

    setLoading(true);
    try {
      const roundsInt = parseInt(rounds) || 1;
      const matchTimeInt = parseInt(matchTime) || 60;
      const maxPlayersInt = parseInt(maxPlayers) || 16;

      const { error } = await supabase.from("tournaments").insert([{
        name: name.trim(),
        date: date.toISOString(),
        description,
        tournament_type: tournamentType,
        rounds: roundsInt,
        match_time: matchTimeInt,
        is_public: isPublic,
        max_players: maxPlayersInt,
        color,
        creator_id: currentUser.id,
        creator_name: currentUser.username,
        password: isPublic ? null : password
      }]);

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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={require("./assets/images/tekken-logo.png")}
          style={{ width: 180, height: 70, resizeMode: "contain", marginBottom: 10 }}
        />
        <Text style={styles.title}>CREAR TORNEO</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre del torneo"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Descripción (opcional)"
          placeholderTextColor="#888"
          value={description}
          multiline
          onChangeText={setDescription}
        />

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.buttonText}>
            Fecha y hora: {date.toLocaleString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handleDateChange}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Tipo de torneo:</Text>
          {["eliminacion_simple", "eliminacion_doble", "round_robin"].map(type => (
            <TouchableOpacity key={type} onPress={() => setTournamentType(type)}>
              <Text style={{
                ...styles.optionText,
                fontWeight: tournamentType === type ? "bold" : "normal",
              }}>
                {type.replace("_", " ").toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Rondas por enfrentamiento:</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={rounds.toString()}
            onChangeText={val => setRounds(val)}
          />

          <Text style={styles.label}>Tiempo por partida (segundos):</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={matchTime.toString()}
            onChangeText={val => setMatchTime(val)}
          />

          <Text style={styles.label}>Privacidad:</Text>
          <TouchableOpacity onPress={() => setIsPublic(!isPublic)}>
            <Text style={styles.optionText}>{isPublic ? "Público" : "Privado"}</Text>
          </TouchableOpacity>

          {!isPublic && (
            <>
              <Text style={styles.label}>Contraseña (opcional):</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginVertical: 0 }]}
                  placeholder="Contraseña del torneo"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    analyzePassword(text);
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={{ color: "#fff", fontSize: 20 }}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.strengthBarBackground}>
                <View
                  style={{
                    height: 6,
                    backgroundColor: "#ff4040",
                    width: `${passwordStrength}%`,
                    borderRadius: 3,
                  }}
                />
              </View>

              {passwordTips.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  {passwordTips.map((tip, idx) => (
                    <Text key={idx} style={{ color: "#ccc", fontSize: 12 }}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={styles.label}>Máximo de jugadores:</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={maxPlayers.toString()}
            onChangeText={val => setMaxPlayers(val)}
          />

          <Text style={styles.label}>Color del torneo:</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {tournamentColors.map(c => (
              <TouchableOpacity
                key={c}
                style={{
                  backgroundColor: c,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  margin: 5,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: "#fff"
                }}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={createTournament}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Creando..." : "Crear Torneo"}</Text>
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
  scrollContainer: { padding: 24, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "900", color: "#ff4040", textAlign: "center", marginBottom: 10 },
  input: { backgroundColor: "#111", color: "#fff", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e43b3b55", marginVertical: 10, width: 260, textAlign: "center" },
  dateButton: { backgroundColor: "#e43b3b", padding: 14, borderRadius: 12, marginVertical: 10 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16, textAlign: "center" },
  section: { marginTop: 15, width: "100%" },
  label: { color: "#ddd", fontSize: 16, marginTop: 10 },
  optionText: { color: "#fff", fontSize: 16, marginVertical: 4 },
  createButton: { backgroundColor: "#ff4040", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, marginVertical: 20 },
  link: { color: "#ff5050", marginTop: 12, fontSize: 14, textDecorationLine: "underline" },
  passwordContainer: { flexDirection: "row", alignItems: "center", width: 260 },
  strengthBarBackground: {
    height: 6,
    backgroundColor: "#555",
    borderRadius: 3,
    marginTop: 6,
    width: 260,
  },
});
