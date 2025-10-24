import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Generar ID único
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// Mezclar array
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Genera bracket de eliminación simple
function generateSingleElimBracket(players) {
  const seeded = shuffle(players);
  const matches = [];
  for (let i = 0; i < seeded.length; i += 2) {
    const p1 = seeded[i];
    const p2 = seeded[i + 1] || null;
    matches.push({ id: uid(), p1: p1?.id || null, p2: p2?.id || null, winnerId: null });
  }
  const rounds = [matches];
  let nextCount = Math.ceil(matches.length / 2);
  while (nextCount > 0 && nextCount !== 1) {
    const arr = Array.from({ length: Math.ceil(nextCount) }, () => ({ id: uid(), p1: null, p2: null, winnerId: null }));
    rounds.push(arr);
    nextCount = Math.ceil(arr.length / 2);
  }
  return rounds;
}

export default function TournamentModule({ goBack, mode }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [newTName, setNewTName] = useState('');

  // Abrir automáticamente el primer torneo si hay torneos en modo "view"
  useEffect(() => {
    if (mode === 'view' && tournaments.length > 0 && !selectedTournament) {
      setSelectedTournament(tournaments[0]);
    }
  }, [mode, tournaments]);

  // Crear torneo
  function createTournament() {
    if (!newTName.trim()) {
      Alert.alert('Nombre requerido', 'Introduce un nombre para el torneo.');
      return;
    }
    const t = { id: uid(), name: newTName.trim(), players: [], rounds: null };
    setTournaments(prev => [t, ...prev]);
    setSelectedTournament(t); // Abrir automáticamente
    setNewTName('');
  }

  function updateTournament(id, patch) {
    setTournaments(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
    if (selectedTournament?.id === id) {
      setSelectedTournament(prev => ({ ...prev, ...patch }));
    }
  }

  // ----- Renderizado -----
  if (!selectedTournament) {
    // Pantalla de creación o listado
    return (
      <View style={{ flex: 1, padding: 10 }}>
        {mode === 'create' && (
          <>
            <Text style={styles.title}>Crear Torneo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del torneo"
              placeholderTextColor="#888"
              value={newTName}
              onChangeText={setNewTName}
            />
            <TouchableOpacity style={styles.button} onPress={createTournament}>
              <Text style={styles.buttonText}>Crear Torneo</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'view' && tournaments.length === 0 && <Text style={{ color:'#aaa', marginTop:10 }}>No hay torneos aún.</Text>}

        {mode === 'view' && tournaments.length > 0 && (
          <FlatList
            data={tournaments}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => setSelectedTournament(item)}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.players.length} jugadores</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity style={[styles.button,{marginTop:10}]} onPress={goBack}>
          <Text style={styles.buttonText}>← Volver al Hub</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Mostrar torneo seleccionado
  return selectedTournament && (
    <TournamentScreen
      tournament={selectedTournament}
      updateTournament={updateTournament}
      goBack={() => setSelectedTournament(null)}
    />
  );
}

// Pantalla individual de torneo
function TournamentScreen({ tournament, updateTournament, goBack }) {
  if (!tournament) return null; // <-- Validación segura

  const [playerName, setPlayerName] = useState('');
  const [localT, setLocalT] = useState(tournament);

  useEffect(() => setLocalT(tournament), [tournament]);

  function addPlayer() {
    if (!playerName.trim()) return;
    const p = { id: uid(), name: playerName.trim() };
    const updated = { ...localT, players: [...localT.players, p] };
    setLocalT(updated);
    updateTournament(localT.id, { players: updated.players });
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
    updateTournament(localT.id, { rounds });
  }

  function setMatchWinner(roundIndex, matchIndex, winnerId) {
    const rounds = localT.rounds.map(r => r.map(m => ({ ...m })));
    rounds[roundIndex][matchIndex].winnerId = winnerId;

    const nextRoundIndex = roundIndex + 1;
    if (nextRoundIndex < rounds.length) {
      const slotIndex = Math.floor(matchIndex / 2);
      const isFirstSlot = matchIndex % 2 === 0;
      if (!rounds[nextRoundIndex][slotIndex]) rounds[nextRoundIndex][slotIndex] = { id: uid(), p1:null, p2:null, winnerId:null };
      if (isFirstSlot) rounds[nextRoundIndex][slotIndex].p1 = winnerId; else rounds[nextRoundIndex][slotIndex].p2 = winnerId;
    } else {
      const next = [{ id: uid(), p1: null, p2: null, winnerId: null }];
      if (matchIndex % 2 === 0) next[0].p1 = winnerId; else next[0].p2 = winnerId;
      rounds.push(next);
    }

    const updated = { ...localT, rounds };
    setLocalT(updated);
    updateTournament(localT.id, { rounds });
  }

  function getPlayerNameById(t, id) {
    if (!id) return '—';
    const p = t.players.find(pp => pp.id === id);
    return p ? p.name : 'Unknown';
  }

  return (
    <ScrollView style={{flex:1, padding:10}}>
      <Text style={styles.title}>{localT.name}</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre jugador"
        placeholderTextColor="#888"
        value={playerName}
        onChangeText={setPlayerName}
      />
      <TouchableOpacity style={styles.button} onPress={addPlayer}>
        <Text style={styles.buttonText}>Añadir Jugador</Text>
      </TouchableOpacity>

      {localT.players.map(p => (
        <Text key={p.id} style={{color:'#fff', marginVertical:2}}>{p.name}</Text>
      ))}

      <TouchableOpacity style={[styles.button,{marginTop:10}]} onPress={generateBracket}>
        <Text style={styles.buttonText}>Generar Bracket</Text>
      </TouchableOpacity>

      {localT.rounds && (
        <ScrollView horizontal style={{marginTop:10}}>
          <View style={{flexDirection:'row'}}>
            {localT.rounds.map((round, ri) => (
              <View key={ri} style={{backgroundColor:'#090909', padding:8, marginRight:10, borderRadius:8, minWidth:220}}>
                <Text style={{color:'#ffd700', fontWeight:'700', marginBottom:6}}>Ronda {ri+1}</Text>
                {round.map((match, mi) => (
                  <View key={match.id} style={{backgroundColor:'#0f0f0f', padding:6, borderRadius:6, borderWidth:1, borderColor:'#222', marginBottom:6}}>
                    <Text style={{color:'#fff'}}>{getPlayerNameById(localT, match.p1)} vs {getPlayerNameById(localT, match.p2)}</Text>
                    <View style={{flexDirection:'row', marginTop:4}}>
                      <TouchableOpacity style={{flex:1, backgroundColor:'#222', padding:4, marginRight:4, borderRadius:4}} disabled={!match.p1} onPress={()=>setMatchWinner(ri,mi,match.p1)}>
                        <Text style={{color:'#fff', fontSize:12}}>{match.p1 ? 'Winner: ' + getPlayerNameById(localT,match.p1) : '—'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{flex:1, backgroundColor:'#222', padding:4, borderRadius:4}} disabled={!match.p2} onPress={()=>setMatchWinner(ri,mi,match.p2)}>
                        <Text style={{color:'#fff', fontSize:12}}>{match.p2 ? 'Winner: ' + getPlayerNameById(localT,match.p2) : '—'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <TouchableOpacity style={[styles.button,{marginTop:10}]} onPress={goBack}>
        <Text style={styles.buttonText}>← Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title:{fontSize:22,fontWeight:'700',color:'#fff',marginBottom:10},
  input:{backgroundColor:'#111',color:'#fff',padding:10,borderRadius:8,borderWidth:1,borderColor:'#222',marginVertical:8},
  button:{backgroundColor:'#e43b3b',padding:10,borderRadius:8,alignItems:'center',marginVertical:4},
  buttonText:{color:'#fff',fontWeight:'700'},
  card:{backgroundColor:'#111',padding:12,borderRadius:10,marginVertical:6,borderWidth:1,borderColor:'#222'},
  cardTitle:{color:'#fff',fontWeight:'700'},
  cardSub:{color:'#aaa',marginTop:4},
});
