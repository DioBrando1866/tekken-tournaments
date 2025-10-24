/*
Tekken Tournaments - Minimal React Native app (single-file)
Run with Expo:
1) expo init tekken-tournaments -t blank
2) Replace App.js with this file
3) expo start

This is a lightweight local-only prototype (no backend). It supports:
- Crear torneos
- Añadir jugadores
- Generar bracket de eliminación simple automáticamente
- Registrar resultados y avanzar ganadores

Improvements you can ask for: Firebase/Realtime backend, double elimination, PWA/web version, prettier UI, character selection, Twitch integration.
*/

import React, { useState } from 'react';
import { Alert, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// Utility: Fisher-Yates shuffle
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate single-elimination bracket as array of rounds, each round is list of matches {id, p1, p2, winnerId}
function generateSingleElimBracket(players) {
  const seeded = shuffle(players);
  const matches = [];
  for (let i = 0; i < seeded.length; i += 2) {
    const p1 = seeded[i];
    const p2 = seeded[i + 1] || null; // bye if odd
    matches.push({ id: uid(), p1: p1 ? p1.id : null, p2: p2 ? p2.id : null, winnerId: null });
  }
  const rounds = [matches];
  // Build empty future rounds placeholders
  let nextCount = Math.ceil(matches.length / 2);
  while (nextCount > 0 && nextCount !== 1) {
    const arr = Array.from({ length: Math.ceil(nextCount) }, () => ({ id: uid(), p1: null, p2: null, winnerId: null }));
    rounds.push(arr);
    nextCount = Math.ceil(arr.length / 2);
  }
  // Note: we'll reconstruct future rounds on the fly when winners are set.
  return rounds;
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [tournaments, setTournaments] = useState([]);
  const [newTName, setNewTName] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  function createTournament() {
    if (!newTName.trim()) {
      Alert.alert('Nombre requerido', 'Introduce un nombre para el torneo.');
      return;
    }
    const t = { id: uid(), name: newTName.trim(), players: [], rounds: null, createdAt: Date.now() };
    setTournaments(prev => [t, ...prev]);
    setNewTName('');
    setScreen('home');
  }

  function openTournament(id) {
    setSelectedTournamentId(id);
    setScreen('tournament');
  }

  function updateTournament(id, patch) {
    setTournaments(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  }

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || null;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tekken Tournaments</Text>
      {screen === 'home' && (
        <View style={{ flex: 1, width: '100%' }}>
          <Text style={styles.section}>Crear nuevo torneo</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Nombre del torneo" value={newTName} onChangeText={setNewTName} />
            <TouchableOpacity style={styles.button} onPress={createTournament}>
              <Text style={styles.buttonText}>Crear</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Torneos</Text>
          {tournaments.length === 0 && <Text style={{ color: '#aaa' }}>No hay torneos. Crea uno arriba.</Text>}
          <FlatList data={tournaments} keyExtractor={i => i.id} renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openTournament(item.id)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>{item.players.length} jugadores</Text>
            </TouchableOpacity>
          )} />
        </View>
      )}

      {screen === 'tournament' && selectedTournament && (
        <TournamentScreen tournament={selectedTournament} goBack={() => setScreen('home')} updateTournament={patch => updateTournament(selectedTournament.id, patch)} />
      )}

    </SafeAreaView>
  );
}

function TournamentScreen({ tournament, goBack, updateTournament }) {
  const [playerName, setPlayerName] = useState('');
  const [localT, setLocalT] = useState(tournament);

  React.useEffect(() => setLocalT(tournament), [tournament]);

  function addPlayer() {
    if (!playerName.trim()) return;
    const p = { id: uid(), name: playerName.trim() };
    const updated = { ...localT, players: [...localT.players, p] };
    setLocalT(updated);
    updateTournament({ players: updated.players });
    setPlayerName('');
  }

  function generateBracket() {
    if (localT.players.length < 2) {
      Alert.alert('Se necesitan al menos 2 jugadores');
      return;
    }
    const rounds = generateSingleElimBracket(localT.players);
    const updated = { ...localT, rounds };
    setLocalT(updated);
    updateTournament({ rounds });
  }

  function setMatchWinner(roundIndex, matchIndex, winnerId) {
    const rounds = localT.rounds.map(r => r.map(m => ({ ...m })));
    rounds[roundIndex][matchIndex].winnerId = winnerId;
    // If there's a next round, place winner into appropriate slot
    const nextRoundIndex = roundIndex + 1;
    if (nextRoundIndex < rounds.length) {
      const slotIndex = Math.floor(matchIndex / 2);
      const isFirstSlot = matchIndex % 2 === 0;
      if (!rounds[nextRoundIndex][slotIndex]) {
        rounds[nextRoundIndex][slotIndex] = { id: uid(), p1: null, p2: null, winnerId: null };
      }
      if (isFirstSlot) rounds[nextRoundIndex][slotIndex].p1 = winnerId; else rounds[nextRoundIndex][slotIndex].p2 = winnerId;
    } else {
      // If next round doesn't exist yet, create it
      const slotIndex = Math.floor(matchIndex / 2);
      const newRound = [];
      const existing = rounds.slice(0, rounds.length);
      // Create at least one future round
      const next = [{ id: uid(), p1: null, p2: null, winnerId: null }];
      if (matchIndex % 2 === 0) next[0].p1 = winnerId; else next[0].p2 = winnerId;
      rounds.push(next);
    }

    const updated = { ...localT, rounds };
    setLocalT(updated);
    updateTournament({ rounds });
  }

  function getPlayerNameById(id) {
    if (!id) return '—';
    const p = localT.players.find(pp => pp.id === id);
    return p ? p.name : 'Unknown';
  }

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <View style={styles.rowBetween}>
        <TouchableOpacity onPress={goBack}><Text style={styles.link}>&lt; Volver</Text></TouchableOpacity>
        <Text style={styles.tournamentTitle}>{localT.name}</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.section}>Jugadores</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="Nombre jugador" value={playerName} onChangeText={setPlayerName} />
        <TouchableOpacity style={styles.button} onPress={addPlayer}><Text style={styles.buttonText}>Añadir</Text></TouchableOpacity>
      </View>

      <FlatList data={localT.players} keyExtractor={p => p.id} renderItem={({ item }) => (
        <View style={styles.playerRow}>
          <Text>{item.name}</Text>
        </View>
      )} />

      <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={generateBracket}><Text style={styles.buttonText}>Generar bracket (Eliminación simple)</Text></TouchableOpacity>

      {localT.rounds && (
        <ScrollView style={{ marginTop: 12 }} horizontal>
          <View style={{ flexDirection: 'row' }}>
            {localT.rounds.map((round, ri) => (
              <View key={ri} style={styles.roundColumn}>
                <Text style={styles.roundTitle}>Ronda {ri + 1}</Text>
                {round.map((match, mi) => (
                  <View key={match.id} style={styles.matchCard}>
                    <Text style={styles.matchText}>{getPlayerNameById(match.p1)} vs {getPlayerNameById(match.p2)}</Text>
                    <View style={styles.row}> 
                      <TouchableOpacity style={styles.smallBtn} disabled={!match.p1} onPress={() => setMatchWinner(ri, mi, match.p1)}>
                        <Text style={styles.smallBtnText}>{match.p1 ? 'Winner: ' + getPlayerNameById(match.p1) : '—'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.smallBtn} disabled={!match.p2} onPress={() => setMatchWinner(ri, mi, match.p2)}>
                        <Text style={styles.smallBtnText}>{match.p2 ? 'Winner: ' + getPlayerNameById(match.p2) : '—'}</Text>
                      </TouchableOpacity>
                    </View>
                    {match.winnerId && <Text style={{ marginTop: 6, fontWeight: '600' }}>Clasificado: {getPlayerNameById(match.winnerId)}</Text>}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#0b0b0b' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  section: { fontSize: 16, fontWeight: '600', color: '#ddd', marginTop: 8, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  input: { flex: 1, backgroundColor: '#111', color: '#fff', padding: 10, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#222' },
  button: { backgroundColor: '#e43b3b', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#111', padding: 12, borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: '#222' },
  cardTitle: { color: '#fff', fontWeight: '700' },
  cardSub: { color: '#aaa', marginTop: 4 },
  tournamentTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#e4e4e4' },
  playerRow: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#111' },
  roundColumn: { backgroundColor: '#090909', padding: 8, borderRadius: 8, marginRight: 10, minWidth: 220 },
  roundTitle: { color: '#ffd700', fontWeight: '700', marginBottom: 8 },
  matchCard: { backgroundColor: '#0f0f0f', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#222', marginBottom: 8 },
  matchText: { color: '#fff', marginBottom: 6 },
  smallBtn: { flex: 1, backgroundColor: '#222', padding: 6, borderRadius: 6, marginRight: 6 },
  smallBtnText: { color: '#fff', fontSize: 12 },
});
