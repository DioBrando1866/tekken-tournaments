import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "./api";
import TournamentModule from "./TournamentModule";


export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login");
  const [loading, setLoading] = useState(true);

  // Verificar token almacenado
  useEffect(() => {
    AsyncStorage.getItem("token").then((t) => {
      if (t) setUser({ username: "Usuario" });
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#e43b3b" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Cargando...</Text>
      </SafeAreaView>
    );

  // ---------- Pantallas de autenticación ----------
  const LoginScreen = ({ goToRegister }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function login() {
      if (!username.trim() || !password.trim()) {
        return Alert.alert("Campos vacíos", "Rellena usuario y contraseña.");
      }

      try {
        const res = await API.post("/auth/login", { username, password });
        await AsyncStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        setScreen("hub");
      } catch (err) {
        console.error(err);
        Alert.alert(
          "Error",
          err.response?.data?.message || "No se pudo iniciar sesión."
        );
      }
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            placeholderTextColor="#888"
            onChangeText={setUsername}
            value={username}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />
          <TouchableOpacity style={styles.button} onPress={login}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToRegister}>
            <Text style={styles.link}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  const RegisterScreen = ({ goToLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function register() {
      if (!username.trim() || !password.trim()) {
        return Alert.alert("Campos vacíos", "Rellena usuario y contraseña.");
      }

      try {
        const res = await API.post("/auth/register", { username, password });
        await AsyncStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        setScreen("hub");
      } catch (err) {
        console.error(err);
        Alert.alert(
          "Error",
          err.response?.data?.message || "No se pudo registrar el usuario."
        );
      }
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>Registro</Text>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            placeholderTextColor="#888"
            onChangeText={setUsername}
            value={username}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />
          <TouchableOpacity style={styles.button} onPress={register}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToLogin}>
            <Text style={styles.link}>Volver a Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // ---------- Hub principal ----------
  if (!user) {
    if (screen === "login")
      return <LoginScreen goToRegister={() => setScreen("register")} />;
    if (screen === "register")
      return <RegisterScreen goToLogin={() => setScreen("login")} />;
  }

  if (screen === "create")
    return <CreateTournamentScreen goBack={() => setScreen("hub")} />;
  
  if (screen === "view")
    return (
      <TournamentModule
        goBack={() => setScreen("hub")}
        mode="view"
      />
    );
  
  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16 }}>
        <Text style={styles.title}>Tekken Tournaments Hub</Text>
        <Text style={styles.subtitle}>
          Bienvenido {user?.username}! Aquí puedes crear torneos.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => setScreen("create")}>
        <Text style={styles.buttonText}>Crear Nuevo Torneo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => setScreen("view")}>
        <Text style={styles.buttonText}>Ver Torneos</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#444" }]}
          onPress={async () => {
            await AsyncStorage.removeItem("token");
            setUser(null);
            setScreen("login");
          }}
        >
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Pantalla: Crear Torneo ----------
const CreateTournamentScreen = ({ goBack }) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  async function createTournament() {
    try {
      await API.post("/tournaments", { name, date });
      Alert.alert("✅ Torneo creado", "El torneo se ha registrado correctamente.");
      goBack();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "No se pudo crear el torneo");
    }
  }

  return (
    <View style={styles.authContainer}>
      <Text style={styles.title}>Crear Nuevo Torneo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del Torneo"
        onChangeText={setName}
        value={name}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha (YYYY-MM-DD)"
        onChangeText={setDate}
        value={date}
      />
      <TouchableOpacity style={styles.button} onPress={createTournament}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goBack}>
        <Text style={styles.link}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
};

// ---------- Pantalla: Ver Torneos ----------
const ViewTournamentsScreen = ({ goBack }) => {
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    API.get("/tournaments")
      .then(res => setTournaments(res.data))
      .catch(() => Alert.alert("Error", "No se pudieron cargar los torneos"));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16 }}>
      <Text style={styles.title}>Torneos Disponibles</Text>
      {tournaments.length === 0 ? (
        <Text style={styles.subtitle}>No hay torneos aún.</Text>
      ) : (
        tournaments.map((t, i) => (
          <View key={i} style={styles.tournamentCard}>
            <Text style={styles.tournamentName}>{t.name}</Text>
            <Text style={styles.tournamentDate}>{t.date}</Text>
          </View>
        ))
      )}
      <TouchableOpacity onPress={goBack} style={[styles.button, { backgroundColor: "#444" }]}>
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b", // 🔥 Fondo oscuro en TODAS las pantallas
  },
  center: { justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginVertical: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#e43b3b",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#222",
    marginVertical: 8,
    width: 250,
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  link: { color: "#e43b3b", marginTop: 10, fontSize: 14 },
  tournamentCard: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    width: 280,
  },
  tournamentName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  tournamentDate: {
    color: "#ccc",
    fontSize: 14,
  },
  
});
