@echo off
setlocal enabledelayedexpansion
title Tekken Tournament Setup

echo 🚀 Iniciando configuración automática para Tekken Tournament...

:: --- Detectar la IP local ---
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr "IPv4" ^| findstr "192."') do (
    set LOCAL_IP=%%A
)
set LOCAL_IP=%LOCAL_IP: =%
echo 🌐 IP local detectada: %LOCAL_IP%

:: --- Comprobar Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Instálalo desde https://nodejs.org/
    pause
    exit /b
)

:: --- Instalar dependencias ---
echo 📦 Instalando dependencias...
call npm install

:: --- Actualizar la IP en los archivos ---
echo 🔧 Actualizando IP en los archivos del proyecto...

for /r %%f in (*.js *.jsx *.ts *.tsx) do (
    powershell -Command "(Get-Content '%%f') -replace 'http://[0-9]{1,3}(\.[0-9]{1,3}){3}:5000', 'http://%LOCAL_IP%:5000' | Set-Content '%%f'"
)

echo ✅ IP actualizada correctamente a http://%LOCAL_IP%:5000

:: --- Iniciar MongoDB ---
echo 🧩 Iniciando MongoDB...
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB no está instalado o no está en el PATH.
    echo ➤ Instálalo desde https://www.mongodb.com/try/download/community y reinicia este script.
    pause
    exit /b
)

start "" mongod
timeout /t 3 >nul

:: --- Iniciar servidor Node ---
echo 🖥️ Iniciando servidor backend...
cd server
call npm install
start "" node server.js
cd ..

:: --- Iniciar Expo ---
echo 📱 Iniciando aplicación Expo...
start "" npx expo start --web

echo ✅ Todo listo. Servidor corriendo en: http://%LOCAL_IP%:5000
pause
