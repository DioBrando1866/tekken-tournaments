#!/bin/bash

echo "======================================"
echo "  🥋 Tekken Tournaments Setup - Ubuntu"
echo "======================================"

# --- 1. Detectar IP local ---
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "🌐 IP local detectada: $LOCAL_IP"

# --- 2. Verificar dependencias ---
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

# --- 3. Configurar MongoDB ---
echo "🧩 Iniciando MongoDB..."
sudo systemctl start mongodb
sleep 2

# --- 4. Configurar servidor Node ---
echo "🚀 Configurando servidor Node..."
cd server || exit
npm install

# Crear archivo server.env si no existe
if [ ! -f "server.env" ]; then
    echo "📄 Creando archivo server.env..."
    cat <<EOF > server.env
MONGO_URI=mongodb://localhost:27017/tekken
PORT=5000
EOF
fi

# --- 5. Lanzar servidor Node ---
echo "🌐 Iniciando servidor Node..."
gnome-terminal -- bash -c "node server.js; exec bash"

# --- 6. Configurar app Expo ---
cd ../app || exit
npm install

# --- 7. Actualizar IP del backend en la app ---
echo "🛠️ Actualizando IP del backend en la app..."

# Buscar archivos donde se usa la IP antigua y reemplazarla
find . -type f -name "*.js" -exec sed -i "s|http://[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+:5000|http://$LOCAL_IP:5000|g" {} \;

echo "✅ IP del backend actualizada a: http://$LOCAL_IP:5000"

# --- 8. Lanzar app Expo ---
echo "⚡ Iniciando Expo..."
gnome-terminal -- bash -c "expo start; exec bash"

echo ""
echo "✅ Todo listo. MongoDB, Node y Expo están ejecutándose."
echo "--------------------------------------"
echo "👉 Servidor Node: http://$LOCAL_IP:5000"
echo "👉 App Expo: escanea el QR con tu móvil (en la misma red WiFi)"
echo "--------------------------------------"
