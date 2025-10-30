@echo off
title 🥋 Tekken Tournaments Setup - Windows 11
echo ======================================
echo   Tekken Tournaments Setup - Windows
echo ======================================

REM --- 1. Verificar Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo ⚠️ Node.js no encontrado. Descárgalo desde https://nodejs.org/en/download/
  pause
  exit /b
) else (
  echo ✅ Node.js encontrado: 
  node -v
)

REM --- 2. Verificar MongoDB ---
where mongod >nul 2>nul
if %errorlevel% neq 0 (
  echo ⚠️ MongoDB no encontrado. Descárgalo desde https://www.mongodb.com/try/download/community
  pause
  exit /b
) else (
  echo ✅ MongoDB encontrado.
)

REM --- 3. Verificar Expo CLI ---
where expo >nul 2>nul
if %errorlevel% neq 0 (
  echo ⚠️ Expo CLI no encontrado. Instalando...
  npm install -g expo-cli
) else (
  echo ✅ Expo CLI encontrado.
)

REM --- 4. Iniciar MongoDB ---
echo 🚀 Iniciando MongoDB...
net start MongoDB

REM --- 5. Configurar servidor Node ---
cd server
if not exist node_modules (
  echo 📦 Instalando dependencias del servidor...
  npm install
)

if not exist server.env (
  echo 📄 Creando archivo server.env...
  echo MONGO_URI=mongodb://localhost:27017/tekken> server.env
  echo PORT=5000>> server.env
)

echo 🌐 Iniciando servidor Node...
start cmd /k "node server.js"

REM --- 6. Configurar app Expo ---
cd ..\app
if not exist node_modules (
  echo 📦 Instalando dependencias de la app...
  npm install
)

echo ⚡ Iniciando Expo...
start cmd /k "expo start"

echo ======================================
echo ✅ Todo listo. Servidor y App en ejecución.
echo --------------------------------------
echo Servidor: http://localhost:5000
echo Expo: escanea el QR o abre en emulador
echo ======================================
pause
