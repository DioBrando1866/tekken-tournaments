import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TournamentModule from './TournamentModule';

export default function App() {
  const [user, setUser] = useState(null); // null = no logueado
  const [screen, setScreen] = useState('login'); // login | register | hub | create | view

  // ---------- Pantallas de autenticación ----------
  const LoginScreen = ({ goToRegister, login }) => {
    const [username, setUsername] = useState('');
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
        <TouchableOpacity style={styles.button} onPress={() => login(username)}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToRegister}>
          <Text style={styles.link}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const RegisterScreen = ({ goToLogin, register }) => {
    const [username, setUsername] = useState('');
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>Registro</Text>
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
        <TouchableOpacity style={styles.button} onPress={() => register(username)}>
          <Text style={styles.buttonText}>Registrar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToLogin}>
          <Text style={styles.link}>Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ---------- Lógica de login/registro ----------
  if (!user) {
    if (screen === 'login') {
      return (
        <LoginScreen
          goToRegister={() => setScreen('register')}
          login={(username) => { if(username.trim()) { setUser({ username }); setScreen('hub'); } }}
        />
      );
    }
    if (screen === 'register') {
      return (
        <RegisterScreen
          goToLogin={() => setScreen('login')}
          register={(username) => { if(username.trim()) { setUser({ username }); setScreen('hub'); } }}
        />
      );
    }
  }

  // ---------- Hub principal ----------
  if (screen === 'create') {
    return <TournamentModule mode="create" goBack={() => setScreen('hub')} />;
  }

  if (screen === 'view') {
    return <TournamentModule mode="view" goBack={() => setScreen('hub')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16 }}>
        <Text style={styles.title}>Tekken Tournaments Hub</Text>
        <Text style={styles.subtitle}>
          Bienvenido {user?.username}! Aquí puedes crear nuevos torneos, gestionar jugadores y seguir los brackets de eliminación simple.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => setScreen('create')}>
          <Text style={styles.buttonText}>Crear Nuevo Torneo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => setScreen('view')}>
          <Text style={styles.buttonText}>Ver Torneos</Text>
        </TouchableOpacity>

        <Text style={styles.filler}>
          Tekken Tournaments es tu aplicación para organizar torneos locales o en línea. 
          Agrega jugadores, genera brackets automáticamente y registra los resultados para seguir la progresión de cada torneo. 
          ¡Prepárate para convertirte en el maestro de Tekken!
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Estilos ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0b' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginVertical: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#ddd', textAlign: 'center', marginBottom: 20 },
  filler: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 20, lineHeight: 20 },
  button: { backgroundColor: '#e43b3b', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginVertical: 10 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  input: { backgroundColor: '#111', color: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#222', marginVertical: 8, width: 250 },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  link: { color: '#e43b3b', marginTop: 10, fontSize: 14 },
});
