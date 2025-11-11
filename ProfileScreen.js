import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./apiSupabase";

const profileImages = {
  "random.png": require("./assets/images/profile-pics/random.png"),
  "Thumbnail-Jin.webp": require("./assets/images/profile-pics/Thumbnail-Jin.webp"),
  "Thumbnail-Jack-8.webp": require("./assets/images/profile-pics/Thumbnail-Jack-8.webp"),
  "Thumbnail-King.webp": require("./assets/images/profile-pics/Thumbnail-King.webp"),
};

export default function ProfileScreen({ goBack, setScreen }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [selectingImage, setSelectingImage] = useState(false);
  const [tempUser, setTempUser] = useState({});
  const [passwords, setPasswords] = useState({ newPassword: "" });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("#fff");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");

  // 🔹 Cargar perfil desde Supabase
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("⚠️ No hay sesión activa");
          setLoading(false);
          return;
        }

        const userId = session.user.id;
        const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

        if (error) throw error;

        setUser(data);
        setTempUser(data);
        setBio(data.bio || "");
        setStatus(data.status || "");
      } catch (err) {
        console.error("❌ Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // 🔹 Guardar nuevo nombre
  async function handleSave() {
    try {
      const { data, error } = await supabase.from("users").update({ username: tempUser.username, bio, status }).eq("id", user.id).select().single();
      if (error) throw error;

      setUser(data);
      setEditing(false);
      Alert.alert("✅ Cambios guardados", "Nombre de usuario y otros cambios guardados.");
    } catch (error) {
      console.error("❌ Error guardando cambios:", error);
      Alert.alert("Error", "No se pudo guardar los cambios.");
    }
  }

  // 🔹 Cambiar la contraseña
  async function handleChangePassword() {
    if (!passwords.newPassword || passwords.newPassword.length < 6) {
      setMessageColor("#ff4d4d");
      setMessage("❌ La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
      if (error) throw error;

      setMessageColor("#4CAF50");
      setMessage("✅ Contraseña actualizada correctamente.");
      setPasswords({ newPassword: "" });
      setChangingPassword(false);
    } catch (error) {
      console.error("❌ Error cambiando contraseña:", error);
      setMessageColor("#ff4d4d");
      setMessage("❌ Error al cambiar la contraseña.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  }

  // 🔹 Cambiar imagen de perfil
  async function handleSelectImage(imageName) {
    try {
      const { error } = await supabase.from("users").update({ profile_image: imageName }).eq("id", user.id);
      if (error) throw error;

      setUser({ ...user, profile_image: imageName });
      setSelectingImage(false);
    } catch (error) {
      console.error("❌ Error actualizando imagen:", error);
      Alert.alert("Error", "No se pudo cambiar la imagen de perfil.");
    }
  }

  async function handleDeleteAccount() {
    if (confirmationInput !== "DELETE") {
      Alert.alert("Error", "Debes escribir 'DELETE' para confirmar.");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert("Error", "No estás autenticado.");
        return;
      }

      const response = await fetch("https://nfnordyuqwenbgjzvlql.supabase.co/functions/v1/deleteUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada correctamente.");
        setScreen("login"); // Redirige a la pantalla de login después de eliminar la cuenta
      } else {
        throw new Error(data.error || "Error eliminando la cuenta");
      }
    } catch (error) {
      console.error("❌ Error eliminando cuenta:", error);
      Alert.alert("Error", "Hubo un problema al eliminar la cuenta.");
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.loading}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Botón Volver al Hub */}
      <TouchableOpacity onPress={() => setScreen("hub")}>
        <Text style={styles.backButton}>← Volver al Hub</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Perfil del Usuario</Text>

      {/* Imagen de perfil */}
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <Image
          source={profileImages[user.profile_image] || profileImages["random.png"]}
          style={styles.profileImage}
        />
        <TouchableOpacity
          style={styles.changeImageButton}
          onPress={() => setSelectingImage(true)}
        >
          <Text style={styles.buttonText}>🖼️ Cambiar imagen</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de imágenes */}
      <Modal visible={selectingImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Elige tu imagen de perfil</Text>
            <View style={styles.imageGrid}>
              {Object.keys(profileImages).map((imgName) => (
                <TouchableOpacity
                  key={imgName}
                  onPress={() => handleSelectImage(imgName)}
                >
                  <Image
                    source={profileImages[imgName]}
                    style={styles.optionImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSelectingImage(false)}
            >
              <Text style={styles.buttonText}>❌ Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Nombre de usuario */}
      <View style={styles.section}>
        <Text style={styles.label}>Nombre de usuario:</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={tempUser.username}
            onChangeText={(text) => setTempUser({ ...tempUser, username: text })}
          />
        ) : (
          <Text style={styles.value}>{user.username}</Text>
        )}
      </View>

      {/* Biografía */}
      <View style={styles.section}>
        <Text style={styles.label}>Biografía:</Text>
        {editing ? (
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={bio}
            onChangeText={setBio}
          />
        ) : (
          <Text style={styles.value}>{bio || "No has añadido una biografía."}</Text>
        )}
      </View>

      {/* Estado personal */}
      <View style={styles.section}>
        <Text style={styles.label}>Estado personal:</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={status}
            onChangeText={setStatus}
          />
        ) : (
          <Text style={styles.value}>{status || "No tienes un estado personal."}</Text>
        )}
      </View>

      {/* Cambiar contraseña */}
      {editing && (
        <View style={styles.section}>
          <Text style={styles.label}>Cambiar contraseña:</Text>
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            secureTextEntry
            value={passwords.newPassword}
            onChangeText={(text) => setPasswords({ newPassword: text })}
          />
          <Button title="Guardar contraseña" onPress={handleChangePassword} />
        </View>
      )}

      {/* Guardar cambios */}
      {editing ? (
        <View style={styles.actions}>
          <Button title="Guardar cambios" onPress={handleSave} />
          <Button title="Cancelar" onPress={() => setEditing(false)} />
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)}>
          <Text style={styles.editButton}>Editar perfil</Text>
        </TouchableOpacity>
      )}

      {/* Mensajes */}
      {message && <Text style={[styles.message, { color: messageColor }]}>{message}</Text>}

      {/* Eliminar cuenta */}
      <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
        <Text style={styles.deleteButton}>Eliminar cuenta</Text>
      </TouchableOpacity>

      {/* Modal para confirmar eliminación */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Eliminar cuenta</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe 'DELETE' para confirmar"
              value={confirmationInput}
              onChangeText={setConfirmationInput}
            />
            <View style={styles.actions}>
              <Button title="Eliminar" onPress={handleDeleteAccount} />
              <Button title="Cancelar" onPress={() => setShowDeleteModal(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    padding: 30,
  },
  backButton: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 30,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    textAlign: "center",
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: "#ddd",
    fontSize: 20,
  },
  value: {
    color: "#fff",
    fontSize: 20,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    fontSize: 18,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changeImageButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#ff5050",
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  editButton: {
    color: "#00bcd4",
    fontSize: 22,
    textAlign: "center",
    marginTop: 20,
  },
  deleteButton: {
    color: "#ff0000",
    fontSize: 22,
    textAlign: "center",
    marginTop: 30,
  },
  message: {
    marginTop: 15,
    textAlign: "center",
    fontSize: 20,
  },
  actions: {
    marginTop: 25,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    width: 350,
    padding: 25,
    backgroundColor: "#222",
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 20,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionImage: {
    width: 100,
    height: 100,
    marginBottom: 15,
    borderRadius: 12,
  },
  cancelButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#ff5050",
    borderRadius: 12,
  },
  loading: {
    color: "#fff",
    fontSize: 24,
  },
});
