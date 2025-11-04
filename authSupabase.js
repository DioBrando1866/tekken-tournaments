// authSupabase.js
import { supabase } from "./apiSupabase";

export async function register(email, password, username) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user?.id || data.session?.user?.id;
  if (!userId) throw new Error("No se pudo obtener el ID del usuario");

  // 🔄 upsert evita duplicados y asegura inserción
  const { error: upsertError } = await supabase
    .from("users")
    .upsert([{ id: userId, username, profile_image: null }], { onConflict: "id" });

  if (upsertError) throw upsertError;

  return data.user;
}

// 🔑 Iniciar sesión
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

// 🚪 Cerrar sesión
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
