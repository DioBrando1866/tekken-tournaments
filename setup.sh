#!/bin/bash
echo "🚀 Iniciando configuración automática para Tekken Tournament..."

# --- Detectar sistema operativo ---
OS=$(uname)
if [[ "$OS" == "Linux" ]]; then
  LOCAL_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OS" == "Darwin" ]]; then
  LOCAL_IP=$(ipconfig getifaddr en0)
else
  echo "⚠️ Sistema operativo no compatible. Usa Ubuntu o macOS."
  exit 1
fi

echo "🌐 IP local detectada: $LOCAL_IP"

# --- Comprobar que existe node y npm ---
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null
then
  echo "❌ Node.js o npm no están instalados. Instálalos antes de continuar."
  exit 1
fi

# --- Instalar dependencias ---
echo "📦 Instalando dependencias..."
npm install

# --- Reemplazar IP en los archivos ---
echo "🔧 Actualizando IP en archivos del proyecto..."
TARGET_DIR="$(pwd)"

# Busca y reemplaza en los archivos donde haya http://<algo>:5000/
find "$TARGET_DIR" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:5000|http://$LOCAL_IP:5000|g" {} +

echo "✅ IP actualizada correctamente en los archivos."

# --- Iniciar MongoDB ---
if ! pgrep mongod > /dev/null
then
  echo "🧩 Iniciando MongoDB..."
  sudo systemctl start mongod || mongod --dbpath ~/data/db --fork --logpath ~/data/mongod.log
else
  echo "✅ MongoDB ya está en ejecución."
fi

# --- Iniciar servidor Node ---
echo "🖥️ Iniciando servidor backend..."
cd server && npm install && node server.js &
cd ..

# --- Iniciar Expo ---
echo "📱 Iniciando app Expo..."
npx expo start --web
