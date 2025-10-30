@echo off
title 🥋 Tekken Tournaments Setup - Windows 11
echo ======================================
echo   Tekken Tournaments Setup - Windows
echo ======================================

REM --- 1. Detectar IP local ---
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr "IPv4" ^| findstr /v "127.0.0.1"') do set LOCAL_IP=%%A
set LOCAL_IP=%LOCAL_IP: =%
echo 🌐 IP local detectada: %LOCAL_IP%

REM --- 2. Verificar Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo ⚠️ Node.js no encontrado. Descárgalo desde https://nodejs.org/en/download/
  pause
  exit /b
) else (
  echo ✅ Node.js encontrado:
  node -v
)

REM --- 3. Verificar MongoDB ---
where mongod >nul 2>nul
if %errorlevel% neq 0 (
  echo ⚠️ MongoDB no encontrado. Descárgalo desde https://www.mongodb.com/try/download/community
  pause
  exit /b
) else (
  echo ✅ MongoDB encontrado.
)

REM --- 4. Verificar Expo CLI ---
where expo >nul 2>nul
if %errorlevel% neq 0 (
  echo ⚠️ Expo CLI no encontrado. Instalando...
  npm install -g expo-cli
) else (
  echo ✅ Expo CLI encontrado.
)

REM --- 5. Iniciar MongoDB ---
echo 🚀 Iniciando MongoDB...
net start MongoDB

REM --- 6. Configurar servidor Node ---
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

REM --- 7. Configurar app Expo ---
cd ..\app
if not exist node_modules (
  echo 📦 Instalando dependencias de la app...
  npm install
)

REM --- 8. Actualizar IP del backend ---
echo 🛠️ Actualizando IP del backend en la app...
for /r %%F in (*.js) do (
  powershell -Command "(Get-Content '%%F') -replace 'http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:5000', 'http://%LOCAL_IP%:5000' | Set-Content '%%F'"
)
echo ✅ IP del backend actualizada a: http://%LOCAL_IP%:5000

REM --- 9. Iniciar Expo ---
echo ⚡ Iniciando Expo...
start cmd /k "expo start"

echo ======================================
echo ✅ Todo listo. Servidor y App en ejecución.
echo --------------------------------------
echo Servidor: http://%LOCAL_IP%:5000
echo Expo: escanea el QR o abre en emulador
echo --------------------------------------
pause
