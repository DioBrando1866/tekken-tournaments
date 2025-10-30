import AsyncStorage from "@react-native-async-storage/async-storage";
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
  View,
} from "react-native";

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
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("#fff");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.warn("⚠️ No hay token guardado");
          setLoading(false);
          return;
        }

        const res = await fetch("http://192.168.1.42:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Error al obtener el perfil");

        const data = await res.json();
        setUser(data);
        setTempUser(data);
      } catch (error) {
        console.error("❌ Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Guardar nuevo nombre
  async function handleSave() {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch("http://192.168.1.42:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: tempUser.username }),
      });

      const data = await res.json();
      setUser(data.user || data); // acepta ambos formatos, por si cambia el backend
      setEditing(false);
      Alert.alert("✅ Cambios guardados", "Nombre de usuario actualizado.");
    } catch (error) {
      console.error("❌ Error guardando cambios:", error);
    }
  }

  // Cambiar contraseña
  async function handleChangePassword() {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        "http://192.168.1.42:5000/api/users/profile/password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessageColor("#ff4d4d");
        setMessage(data.message || "❌ Error al cambiar la contraseña");
      } else {
        setMessageColor("#4CAF50");
        setMessage(data.message || "✅ Contraseña actualizada correctamente");
        setPasswords({ currentPassword: "", newPassword: "" });
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error cambiando contraseña:", err);
      setMessageColor("#ff4d4d");
      setMessage("❌ Error al cambiar la contraseña");
    }
  }

  // Cambiar imagen de perfil
  async function handleSelectImage(imageName) {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch("http://192.168.1.42:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profileImage: imageName }),
      });

      if (!res.ok) throw new Error("Error al actualizar imagen");

      const data = await res.json();
      setUser(data.user); // 👈 accedemos al campo "user"
      setSelectingImage(false);
      setSelectingImage(false);
    } catch (error) {
      console.error("❌ Error actualizando imagen:", error);
      Alert.alert("Error", "No se pudo cambiar la imagen de perfil.");
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
          source={
            profileImages[user.profileImage] || profileImages["random.png"]
          }
          style={styles.profileImage}
        />

        <TouchableOpacity
          style={styles.changeImageButton}
          onPress={() => setSelectingImage(true)}
        >
          <Text style={styles.buttonText}>🖼️ Cambiar imagen</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de imágenes (Modal) */}
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
                  <Image source={profileImages[imgName]} style={styles.optionImage} />
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
            <Text style={styles.label}>Contraseña actual:</Text>
            <TextInput
              secureTextEntry
              style={styles.input}
              value={passwords.currentPassword}
              onChangeText={(text) =>
                setPasswords({ ...passwords, currentPassword: text })
              }
            />

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

        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.buttonText}>← Volver al Hub</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#111",
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
