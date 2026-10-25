# 🎨 Sketch Rush — Multiplayer Drawing & Guessing Game

> **Welcome to Sketch Rush!**  
> An end-to-end, full-stack **MERN** multiplayer Pictionary game inspired by skribbl.io. Built with passion and clean code by **Vishesh Kumar**.

---
https://sketch-rush.onrender.com/ :-> live url link 

## 🌟 Overview

**Sketch Rush** is a real-time multiplayer drawing and word-guessing web application. Friends or public players can join a room, take turns sketching secret words on an interactive canvas, and guess in live chat to earn points and claim a spot on the global Hall of Fame!

### 🎮 How the Game Works:
1. **Join or Create a Room**: Jump into a **Quick Play** match or create your own custom room with custom rules (draw time, rounds, categories).
2. **Turn-Based Drawing**: Each round, one player is chosen as the drawer. They pick 1 of 3 secret words and draw it on the digital canvas.
3. **Live Guessing**: Other players type their guesses into the chat. 
4. **Intelligent Hints**: Letters are gradually uncovered over time (`_ _ a _ _`), and close guesses alert players with *"You're close!"*.
5. **Score & Win**: Faster guesses earn higher points! At the end of all rounds, the podium reveals the top 3 winners with a confetti celebration.

---

## 📁 Project Structure

Single full-stack repo: one Node server serves the REST API, Socket.IO and the built React app.

```
sketch-rush/
├── server.ts          Express + Socket.IO entry point
├── server/            Game logic (Game, Room, Player, RoomManager) + MongoDB models
├── src/               React frontend (components, canvas, services)
├── public/            Static assets
├── index.html, vite.config.ts, tsconfig.json
├── package.json, package-lock.json
├── render.yaml, railway.json, Procfile   Deployment configs
└── .env.example       Environment variable template (copy to .env locally)
```

---

## 🛠️ Technology Stack (MERN Architecture)

This application is built from the ground up using the **MERN** technology stack:

- **MongoDB (Database)**: 
  - Hosted on MongoDB Atlas.
  - Managed via **Mongoose** schemas for saving match history, player high scores, and community custom word lists.
- **Express.js (Backend Framework)**:
  - Robust REST API endpoints for room discovery, category management, and leaderboards.
- **React 19 + TypeScript (Frontend)**:
  - Fast, modular single-page application built with **Vite** and styled with **Tailwind CSS**.
  - Interactive HTML5 Canvas API with responsive scaling, colors, thickness options, eraser, undo, and bucket fill.
  - Custom SVG Cartoon Avatar generator (customizable hair/body color, eyes, and expressions).
- **Node.js + Socket.IO (Real-Time Communication)**:
  - Low-latency WebSocket protocol for instantaneous stroke synchronization, timer countdowns, and live chat messaging.

---

## ✨ Key Features

| Category | Highlights |
| :--- | :--- |
| **Multiplayer Rooms** | Public & Private rooms, 6-character room codes, 1-click shareable invite links (`/?room=CODE`). |
| **Drawing Tools** | Brush pen, 16+ vibrant colors, 4 brush sizes (S, M, L, XL), Eraser, Bucket Fill, Undo, and Clear Canvas. |
| **Smart Guessing** | Case-insensitive Levenshtein distance matching (detects typos & alerts "You're close!"). |
| **Custom Rules** | Host can adjust: Max Players (2–20), Rounds (2–10), Draw Time (15–120s), Word Categories, and Custom Word Packs. |
| **Solo Test Mode** | Includes a **`+ Add Bot (Solo Test)`** button in the waiting lobby so anyone can test the full game without needing a second player! |
| **Hall of Fame** | Persistent MongoDB scoreboard showcasing top players and champions of all time. |
| **Celebrations & Audio** | Native Web Audio synthesizer for cheerful sound effects and `canvas-confetti` bursts on victory. |

---

## 🏛️ Clean OOP Server Structure

To maintain clean and scalable code, the WebSocket server is organized using Object-Oriented Programming (OOP):

- **`Player` (`server/game/Player.ts`)**: Represents a player instance, their socket connection, scores, avatar styles, and host permissions.
- **`Game` (`server/game/Game.ts`)**: Manages the game state machine (Lobby → Selecting Word → Drawing → Round End → Game Over), turn rotation, timer intervals, and scoring logic.
- **`Room` (`server/game/Room.ts`)**: Manages player collections, chat logs, stroke history, host moderation (kick/ban), and MongoDB persistence.
- **`RoomManager` (`server/game/RoomManager.ts`)**: Singleton handling room creation, matchmaking, and automatic garbage collection of idle rooms.

---

## 🚀 Quick Start Guide (Run Locally)

Running the project on your local machine is quick and straightforward:

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd sketch-rush
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the project root:
```env
PORT=3000
MONGODB_URI="mongodb+srv://<db_user>:<db_password>@<your-cluster>.mongodb.net/sketchrush?retryWrites=true&w=majority"
```

### 4. Start the application
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser and start playing!

---

## 🧪 Testing & Verification

The codebase includes automated unit tests for core game logic:

```bash
# Run pure logic unit tests (Scoring, Levenshtein distance, Hints)
npx --yes tsx --test src/game/logic.test.ts

# Verify TypeScript build
npm run build
```

✅ **All 7/7 unit tests pass cleanly.**

---

## 🚢 Step-by-Step Deployment Guide (डिटेल गाइड)

Aap iss project ko **2 tarike se deploy** kar sakte hain:
- **Method 1: Single Full-Stack Deployment** (Backend + Frontend ek sath — **Render** ya **Railway** par) 👉 *Sabse aasan aur recommended!*
- **Method 2: Separate Deployment** (Backend **Render/Railway** par aur Frontend **Vercel/Netlify** par with Axios API).

---

### 🌐 Method 1: Deploy on Render (Recommended - Free & Easy)
Render par Express + WebSockets + React static serving ek hi service me perfectly chalta hai:

1. **GitHub Par Push Karein**:
   Apne local project code ko apne GitHub account par push kijiye.
2. **Render Par Account Banayein**:
   [render.com](https://render.com) par jaakar GitHub se Sign In karein.
3. **New Web Service Create Karein**:
   - Dashboard me **"New +"** button par click karke **"Web Service"** choose karein.
   - Apni GitHub repository select karke connect karein.
4. **Settings Configure Karein**:
   - **Name**: `sketch-rush` (ya koi bhi name)
   - **Region**: Singapore / Frankfurt (koi bhi nearest region)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. **Environment Variables Add Karein**:
   Neeche **"Advanced" ➔ "Add Environment Variable"** par click karein aur yeh 2 values daalein:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://<db_user>:<db_password>@<your-cluster>.mongodb.net/sketchrush?retryWrites=true&w=majority`
6. **Deploy**:
   **"Deploy Web Service"** par click karein. 2-3 minute me aapko aapka live link mil jayega (e.g. `https://sketch-rush.onrender.com`).

---

### 🚂 Method 2: Deploy on Railway
Railway automatically detect karta hai aur 1-click me deploy kar deta hai:

1. [railway.app](https://railway.app) par login karein.
2. **"New Project" ➔ "Deploy from GitHub repo"** select karein.
3. Apni repo select karein.
4. Repository settings me **"Variables"** tab me jayein aur yeh variable add karein:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://<db_user>:<db_password>@<your-cluster>.mongodb.net/sketchrush?retryWrites=true&w=majority`
5. **Networking**: Settings me **"Generate Domain"** par click karein.
6. Railway automatic build karke app live kar dega!

---

### ⚡ Method 3: Separate Frontend on Vercel + Backend on Render/Railway
Agar aap Frontend ko Vercel par aur Backend ko Render par alag-alag host karna chahte hain:

#### Step A: Pehle Backend Render ya Railway par deploy karein
- Upar diye gaye **Render** steps follow karke backend ko deploy karein.
- Aapko backend ka public URL mil jayega (e.g. `https://sketch-rush-backend.onrender.com`).

#### Step B: Frontend ko Vercel par deploy karein
1. [vercel.com](https://vercel.com) par login karke **"Add New Project"** click karein.
2. Apni GitHub repo choose karein.
3. Framework Preset: **Vite**.
4. **Environment Variables** section kholein aur yeh variable add karein:
   - `VITE_BACKEND_URL` = `https://sketch-rush-backend.onrender.com` (apna actual backend URL daalein).
5. **"Deploy"** par click karein!
6. Vercel automatically Axios aur Socket.IO ko aapke backend se connect kar dega!

---

### 🐳 Method 4: Deploy using Docker
Project me production `Dockerfile` already included hai:
```bash
# Docker image build karein
docker build -t sketch-rush .

# Container run karein
docker run -d -p 3000:3000 \
  -e NODE_ENV="production" \
  -e MONGODB_URI="mongodb+srv://<db_user>:<db_password>@<your-cluster>.mongodb.net/sketchrush?retryWrites=true&w=majority" \
  sketch-rush
```

---

## 👨‍💻 Author & Acknowledgements

- **Developer**: **Vishesh Kumar**  
- **Role**: Full-Stack MERN Software Engineer  
- **Assignment**: skribbl.io Full-Stack Clone  

*Thank you for checking out Sketch Rush! If you have any suggestions or feedback, feel free to reach out.*
