# 🥋 Tekken Tournaments — Guía Completa de Instalación y Ejecución

Este proyecto consta de tres servicios principales:

1. **Servidor Node.js / Express** → Lógica de negocio y conexión a MongoDB.  
2. **Base de datos MongoDB** → Almacenamiento de usuarios, torneos y contraseñas.  
3. **Aplicación Expo (React Native)** → Interfaz móvil donde los jugadores gestionan su perfil, torneos, etc.

---

## 🚀 Requisitos Previos

Asegúrate de tener instalados los siguientes programas:

| Herramienta | Versión recomendada | Requerido por |
|--------------|--------------------|----------------|
| [Node.js](https://nodejs.org/) | >= 18.x | Servidor + Expo |
| [npm](https://www.npmjs.com/) | >= 9.x | Servidor + Expo |
| [MongoDB Community Server](https://www.mongodb.com/try/download/community) | >= 6.0 | Base de datos |
| [Git](https://git-scm.com/downloads) | — | Clonar el repositorio |
| [Expo CLI](https://docs.expo.dev/get-started/installation/) | — | Aplicación móvil |

---

## 📂 Estructura del Proyecto
tekken-tournaments/
│
├── app/ # Aplicación Expo (frontend móvil)
│ ├── App.js
│ ├── assets/ # Imágenes de perfil de Tekken
│ 
├── server/ # Backend Node.js / Express
│ ├── routes/ # Rutas (user.js, tournaments.js, etc.)
│ ├── models/ # Esquemas de MongoDB
│ ├── server.js # Punto de entrada
│ └── server.env # Variables de entorno
│
└── README.md # Este archivo

## Instalación Windows 10
   ## Node JS
   Link: https://nodejs.org/en/download/
   node -v
   npm -v

## Instalar MongoDB en Windows

Descarga desde https://www.mongodb.com/try/download/community
Durante la instalación, marca la casilla “Install MongoDB as a Service”.
(Opcional) Instala MongoDB Compass para una interfaz gráfica.
MongoDB se ejecutará automáticamente en localhost:27017.

## Instalar Expo CLI

npm install -g expo-cli

cd ../app
npm install
expo start

## Comandos Útiles
Iniciar servidor Node.js node server.js
Iniciar aplicación Expo	expo start
Ver logs de MongoDB (Ubuntu)	sudo journalctl -u mongodb
Abrir consola Mongo	mongosh
Limpiar dependencias	rm -rf node_modules && npm install
