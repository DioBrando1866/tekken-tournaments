import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import "react-native-url-polyfill/auto";
import CreateTournamentScreen from "./CreateTournamentScreen";
import LoginScreen from "./LoginScreen";
import ProfileScreen from "./ProfileScreen";
import RegisterScreen from "./RegisterScreen";
import TournamentModule from "./TournamentModule";
import { supabase } from "./apiSupabase";

// ---------- Fondo animado ----------
export const AnimatedBackground = () => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#0b0b0b", "#250000"],
  });

  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />;
};

// ---------- Logo Tekken ----------
const TekkenLogo = () => {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity,
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <Image
        source={require("./assets/images/tekken-logo.png")}
        style={{ width: 400, height: 160, resizeMode: "contain" }}
      />
    </Animated.View>
  );
};

// ---------- App principal ----------
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login");
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [username, setUsername] = useState("");

  useEffect(() => {
    async function fetchUsername() {
      if (!user) return;
  
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();
  
      if (!error && data) setUsername(data.username);
    }
  
    fetchUsername();
  }, [user]);

  // Fade in al cargar cada pantalla
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [screen]);

  // Recuperar sesión Supabase al iniciar
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setUser(session.user);
          await AsyncStorage.setItem("token", session.access_token);
          await AsyncStorage.setItem("user", JSON.stringify(session.user));
        } else {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) setUser(JSON.parse(storedUser));
          else setUser(null);
        }
      } catch (err) {
        console.error("Error cargando sesión:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Listener de cambios de sesión (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await AsyncStorage.setItem("token", session.access_token);
          await AsyncStorage.setItem("user", JSON.stringify(session.user));
          setUser(session.user);
          setScreen("hub");
        } else if (event === "SIGNED_OUT") {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          setUser(null);
          setScreen("login");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading)
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <AnimatedBackground />
        <ActivityIndicator size="large" color="#e43b3b" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Cargando...</Text>
      </SafeAreaView>
    );

  // ---------- Pantallas de Auth ----------
  if (!user) {
    if (screen === "login")
      return (
        <LoginScreen
          goToRegister={() => setScreen("register")}
          onLoginSuccess={(u) => {
            setUser(u);
            setScreen("hub");
          }}
        />
      );

    if (screen === "register")
      return <RegisterScreen goToLogin={() => setScreen("login")} />;
  }

  // ---------- Navegación principal ----------
  if (screen === "create")
    return <CreateTournamentScreen goBack={() => setScreen("hub")} />;

  if (screen === "view")
    return <TournamentModule goBack={() => setScreen("hub")} mode="view" />;

  if (screen === "profile")
    return <ProfileScreen goBack={() => setScreen("hub")} user={user} />;
  
  if (screen === "details")
    return <TournamentDetailScreen goBack={() => setScreen("view")} tournament={selectedTournament} />;

  if (screen === "bracket")
    return <BracketScreen tournament={selectedTournament} goBack={() => setScreen("view")} />;
  
  

  // ---------- Pantalla Hub ----------

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <AnimatedBackground />
      <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16 }}>
        <TekkenLogo />
        <Text style={styles.bigTitle}>TEKKEN TOURNAMENTS HUB</Text>
        <Text style={styles.subtitle}>
          Bienvenido {username || "luchador"}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setScreen("create")}
        >
          <Text style={styles.buttonText}>Crear Torneo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setScreen("view")}
        >
          <Text style={styles.buttonText}>Ver Torneos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setScreen("profile")}
        >
          <Text style={styles.buttonText}>Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#333" }]}
          onPress={async () => {
            await supabase.auth.signOut();
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            setUser(null);
            setScreen("login");
          }}
        >
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

// ---------- Estilos ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  center: { justifyContent: "center", alignItems: "center" },
  bigTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ff4040",
    textAlign: "center",
    textShadowColor: "#ff0000",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginVertical: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#e43b3b",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: "#e43b3b",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
  },
});
