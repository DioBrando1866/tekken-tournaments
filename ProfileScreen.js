import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image, Platform, ScrollView,
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

export default function ProfileScreen({ goBack, setScreen }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectingImage, setSelectingImage] = useState(false);
  const [tempUser, setTempUser] = useState({});
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");

  async function registerPushToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Ignorar web
    if (!Device.isDevice || Platform.OS === "web") return;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    await supabase
      .from("users")
      .update({ push_token: token })
      .eq("id", session.user.id);
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
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

        await registerPushToken();
      } catch (err) {
        console.error("❌ Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  async function handleSave() {
    try {
      const { data, error } = await supabase.from("users")
        .update({ username: tempUser.username, bio, status })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;

      setUser(data);
      setEditing(false);
      Alert.alert("✅ Cambios guardados", "Nombre de usuario y otros cambios guardados.");
    } catch (error) {
      console.error("❌ Error guardando cambios:", error);
      Alert.alert("Error", "No se pudo guardar los cambios.");
    }
  }

  async function pickAndUploadImage(userId) {
    try {
      // Abre el selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Asegúrate de que sea una imagen
        quality: 0.7, // Comprime la imagen para mejorar el tiempo de carga
      });
  
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("No se seleccionó ninguna imagen.");
        return null; // Si el usuario cancela o no selecciona una imagen
      }
  
      const uri = result.assets[0].uri;
  
      // Verifica que el URI sea válido
      if (!uri || typeof uri !== "string") {
        throw new Error("URI de la imagen no es válida.");
      }
  
      console.log("URI de la imagen:", uri); // Imprime el URI de la imagen
  
      // Extrae el blob de la imagen
      let file;
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        file = await response.blob();
      } else {
        file = await fetch(uri).then((r) => r.blob());
      }
  
      // Verifica que el blob se haya extraído correctamente
      if (!file) {
        throw new Error("No se pudo obtener el blob de la imagen.");
      }
  
      // Intenta obtener la extensión del tipo MIME
      const mimeType = file.type; // El tipo MIME del archivo
      let fileExtension = "";
  
      // Comprobar el tipo MIME y asignar una extensión
      if (mimeType.includes("image/jpeg")) {
        fileExtension = ".jpg";
      } else if (mimeType.includes("image/png")) {
        fileExtension = ".png";
      } else if (mimeType.includes("image/gif")) {
        fileExtension = ".gif";
      } else {
        throw new Error("Tipo de archivo no soportado.");
      }
  
      // Asegúrate de que userId sea un valor válido
      let userIdStr = null;
      if (userId && typeof userId === "object" && userId.id) {
        userIdStr = `${userId.id}`; // Si userId es un objeto y tiene la propiedad `id`
      } else if (typeof userId === "string") {
        userIdStr = userId; // Si userId ya es un string, usémoslo directamente
      }
  
      if (!userIdStr) {
        throw new Error("userId no es válido.");
      }
  
      // Genera un nombre de archivo basado en el usuario y la fecha
      const filename = `${userIdStr}-${Date.now()}${fileExtension}`;
  
      console.log("Nombre del archivo:", filename); // Imprime el nombre del archivo
  
      // Subir la imagen al bucket de Supabase
      const { data, error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filename, file, { upsert: true });
  
      if (uploadError) {
        throw uploadError;
      }
  
      // Actualizar la base de datos con el nombre del archivo subido
      const { error: dbError } = await supabase
        .from("users")
        .update({ profile_image: filename })
        .eq("id", userIdStr); // Asegúrate de que el id sea un string válido
  
      if (dbError) {
        throw dbError;
      }
  
      console.log("Imagen subida con éxito:", filename);
  
      // Actualizar el estado con el nuevo nombre de archivo
      setUser({ ...user, profile_image: filename });
  
      return filename; // Retorna el nombre de archivo
    } catch (err) {
      console.error("❌ Error subiendo imagen:", err);
      return null;
    }
  }
  

  async function removeProfileImage() {
    try {
      await supabase.from("users").update({ profile_image: null }).eq("id", user.id);
      setUser({ ...user, profile_image: null });
      Alert.alert("✅ Imagen eliminada", "Se ha restablecido la imagen por defecto.");
    } catch (err) {
      console.error("Error eliminando imagen:", err);
      Alert.alert("Error", "No se pudo eliminar la imagen.");
    }
  }

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator color="#fff" />
      <Text style={styles.loading}>Cargando perfil...</Text>
    </View>
  );

  if (!user) return (
    <View style={styles.container}>
      <Text style={styles.loading}>No se pudo cargar el perfil.</Text>
    </View>
  );

  const profileImageSource = user.profile_image
    ? { uri: supabase.storage.from("profile-pictures").getPublicUrl(user.profile_image).data.publicUrl }
    : require("./assets/images/profile-pics/random.png");

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setScreen("hub")}>
        <Text style={styles.backButton}>← Volver al Hub</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Perfil del Usuario</Text>

      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <Image source={profileImageSource} style={styles.profileImage} />

        <View style={{ flexDirection: "row", marginTop: 10 }}>
        <TouchableOpacity 
  style={styles.changeImageButton} 
  onPress={() => pickAndUploadImage(user.id)} // Pasa el user.id aquí
>
  <Text style={styles.buttonText}>🖼️ Cambiar imagen</Text>
</TouchableOpacity>

          {user.profile_image && (
            <TouchableOpacity style={[styles.changeImageButton, { marginLeft: 10, backgroundColor: "#555" }]} onPress={removeProfileImage}>
              <Text style={styles.buttonText}>❌ Eliminar imagen</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.label}>Biografía:</Text>
        {editing ? (
          <TextInput style={[styles.input, { height: 80 }]} multiline value={bio} onChangeText={setBio} />
        ) : (
          <Text style={styles.value}>{bio || "No has añadido una biografía."}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Estado personal:</Text>
        {editing ? (
          <TextInput style={styles.input} value={status} onChangeText={setStatus} />
        ) : (
          <Text style={styles.value}>{status || "No tienes un estado personal."}</Text>
        )}
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b", padding: 30 },
  backButton: { color: "#fff", fontSize: 22, marginBottom: 30 },
  title: { color: "#fff", fontSize: 30, textAlign: "center", marginBottom: 30 },
  section: { marginBottom: 20 },
  label: { color: "#ddd", fontSize: 20 },
  value: { color: "#fff", fontSize: 20 },
  input: { backgroundColor: "#222", color: "#fff", padding: 15, borderRadius: 12, marginTop: 15, fontSize: 18 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  changeImageButton: { padding: 15, backgroundColor: "#ff5050", borderRadius: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  editButton: { color: "#00bcd4", fontSize: 22, textAlign: "center", marginTop: 20 },
  loading: { color: "#fff", fontSize: 24 },
  actions: { marginTop: 25 },
});
