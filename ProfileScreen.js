import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "./apiSupabase";

const profileImages = {
  "random.png": require("./assets/images/profile-pics/random.png"),
  "Thumbnail-Jin.webp": require("./assets/images/profile-pics/Thumbnail-Jin.webp"),
  "Thumbnail-Jack-8.webp": require("./assets/images/profile-pics/Thumbnail-Jack-8.webp"),
  "Thumbnail-King.webp": require("./assets/images/profile-pics/Thumbnail-King.webp"),
};

export default function ProfileScreen({ goBack }) {
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
      const { data, error } = await supabase.from("users").update({ username: tempUser.username }).eq("id", user.id).select().single();
      if (error) throw error;

      setUser(data);
      setEditing(false);
      Alert.alert("✅ Cambios guardados", "Nombre de usuario actualizado.");
    } catch (error) {
      console.error("❌ Error guardando cambios:", error);
      Alert.alert("Error", "No se pudo actualizar el nombre.");
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
    // Verificar que la entrada de confirmación sea "DELETE"
    if (confirmationInput === "DELETE") {
      try {
        // 1. Eliminar el registro del usuario en la tabla 'users'
        const { error: deleteUserError } = await supabase.from("users").delete().eq("id", user.id);
        if (deleteUserError) throw deleteUserError;
  
        // 2. Cerrar sesión del usuario
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
  
        // 3. Eliminar usuario desde Supabase Auth
        const { error: deleteAuthError } = await supabase.auth.api.deleteUser(user.id);
        if (deleteAuthError) throw deleteAuthError;
  
        Alert.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada correctamente.");
        goBack(); // Volver a la pantalla anterior después de la eliminación
      } catch (error) {
        console.error("❌ Error eliminando cuenta:", error);
        Alert.alert("Error", "Hubo un problema al eliminar la cuenta.");
      }
    } else {
      Alert.alert("Error", "Debes escribir 'DELETE' para confirmar.");
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
      <Text style={styles.title}>Perfil del Usuario</Text>

      {/* Imagen de perfil */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
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

      {/* Usuario */}
      <View style={styles.section}>
        <Text style={styles.label}>Nombre de usuario:</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={tempUser.username}
            onChangeText={(text) =>
              setTempUser({ ...tempUser, username: text })
            }
          />
        ) : (
          <Text style={styles.value}>{user.username}</Text>
        )}
      </View>

      {/* Botones principales */}
      <View style={styles.buttons}>
        {editing ? (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>💾 Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setTempUser(user);
                setEditing(false);
              }}
            >
              <Text style={styles.buttonText}>❌ Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.buttonText}>✏️ Editar nombre</Text>
          </TouchableOpacity>
        )}

        {!changingPassword && (
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setChangingPassword(true)}
          >
            <Text style={styles.buttonText}>🔒 Cambiar contraseña</Text>
          </TouchableOpacity>
        )}

        {changingPassword && (
          <View style={styles.section}>
            <Text style={styles.label}>Nueva contraseña:</Text>
            <TextInput
              secureTextEntry
              style={styles.input}
              value={passwords.newPassword}
              onChangeText={(text) =>
                setPasswords({ ...passwords, newPassword: text })
              }
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.buttonText}>💾 Guardar nueva contraseña</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setChangingPassword(false)}
            >
              <Text style={styles.buttonText}>❌ Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {message ? (
          <Text
            style={{
              color: messageColor,
              textAlign: "center",
              marginVertical: 10,
            }}
          >
            {message}
          </Text>
        ) : null}

        {/* Botón para eliminar cuenta */}
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={styles.buttonText}>❌ Eliminar cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.buttonText}>← Volver al Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de confirmación para eliminar cuenta */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar eliminación de cuenta</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe 'DELETE' para confirmar"
              value={confirmationInput}
              onChangeText={setConfirmationInput}
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.buttonText}>Eliminar cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.buttonText}>❌ Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  section: { marginBottom: 16 },
  label: { color: "#ffd700", fontSize: 14, marginBottom: 6 },
  value: { color: "#fff", fontSize: 16 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#ffd700",
  },
  buttons: { marginTop: 20 },
  editButton: {
    backgroundColor: "#e43b3b",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  changeImageButton: {
    backgroundColor: "#444",
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  changePasswordButton: {
    backgroundColor: "#0066cc",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteAccountButton: {
    backgroundColor: "#ff4d4d",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  loading: { color: "#fff", textAlign: "center", marginTop: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  optionImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    margin: 5,
    borderWidth: 2,
    borderColor: "#ffd700",
  },
});
