#!/bin/bash

echo "======================================"
echo "  🥋 Tekken Tournaments Setup - Ubuntu"
echo "======================================"

# --- 1. Verificar dependencias ---
echo "🔍 Verificando dependencias..."
if ! command -v node &> /dev/null
then
    echo "⚠️ Node.js no está instalado. Instalando..."
    sudo apt update && sudo apt install -y nodejs npm
else
    echo "✅ Node.js encontrado: $(node -v)"
fi

if ! command -v mongod &> /dev/null
then
    echo "⚠️ MongoDB no está instalado. Instalando..."
    sudo apt install -y mongodb
    sudo systemctl enable mongodb
    sudo systemctl start mongodb
else
    echo "✅ MongoDB encontrado."
fi

if ! command -v expo &> /dev/null
then
    echo "⚠️ Expo CLI no encontrado. Instalando..."
    sudo npm install -g expo-cli
else
    echo "✅ Expo CLI encontrado."
fi

# --- 2. Configurar MongoDB ---
echo "🧩 Iniciando MongoDB..."
sudo systemctl start mongodb
sleep 2
sudo systemctl status mongodb --no-pager | head -n 5

# --- 3. Configurar servidor Node ---
echo "🚀 Configurando servidor Node..."
cd server || exit
npm install

# Crear archivo .env si no existe
if [ ! -f "server.env" ]; then
    echo "📄 Creando archivo server.env..."
    cat <<EOF > server.env
MONGO_URI=mongodb://localhost:27017/tekken
PORT=5000
EOF
fi

# --- 4. Lanzar servidor Node ---
echo "🌐 Iniciando servidor Node..."
gnome-terminal -- bash -c "node server.js; exec bash"

# --- 5. Configurar app Expo ---
echo "📱 Configurando app Expo..."
cd ../app || exit
npm install

# --- 6. Lanzar app Expo ---
echo "⚡ Iniciando Expo..."
gnome-terminal -- bash -c "expo start; exec bash"

echo ""
echo "✅ Todo listo. MongoDB, Node y Expo están ejecutándose."
echo "--------------------------------------"
echo "👉 Servidor: http://localhost:5000"
echo "👉 App Expo: escanea el QR o abre en emulador"
echo "--------------------------------------"
