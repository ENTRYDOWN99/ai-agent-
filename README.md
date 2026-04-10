# 🤖 AgentFlow — Multi-Agent AI Task Management System

<div align="center">

![AgentFlow Banner](https://img.shields.io/badge/AgentFlow-AI%20Task%20Manager-7C3AED?style=for-the-badge&logo=robot&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**A full-stack multi-agent AI system for intelligent task, calendar, and notes management.**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Docs](#-api-endpoints) • [Deployment](#-deployment)

</div>

---

## ✨ Features

- 🤖 **Multi-Agent AI System** — Orchestrator coordinates Task, Calendar & Notes agents
- 📋 **Task Management** — Full CRUD with priorities, categories, and due dates
- 📅 **Calendar / Events** — Schedule meetings, reminders, and deadlines
- 📝 **Notes** — Create, pin, search, and tag notes
- ⚡ **Multi-Step Workflows** — Plan My Day, Weekly Summary, Create Project
- 🔐 **JWT Authentication** — Secure login/signup with role-based access
- 👤 **Guest Mode** — Explore without sign-up
- 🔍 **Search & Filter** — Full-text search across all entities
- 📊 **Dashboard** — Real-time stats, recent activity, agent logs
- 🔌 **MCP Tool Registry** — Extensible tool system for agents
- 🔔 **Real-time Updates** — WebSocket support via Socket.IO

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                       │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  React Web   │  │ React Native │                 │
│  │  (Vite)      │  │   (Mobile)   │                 │
│  └──────┬───────┘  └──────┬───────┘                 │
│         └────────┬────────┘                          │
│                  │ REST API + WebSocket               │
├──────────────────┼──────────────────────────────────┤
│           Backend Layer (Node.js + Express)           │
│  ┌───────────────────────────────────────────┐       │
│  │       Orchestrator Agent (Primary)         │       │
│  │  ┌───────────┬──────────┬──────────────┐  │       │
│  │  │Task Agent │Calendar  │ Notes Agent  │  │       │
│  │  └───────────┴──────────┴──────────────┘  │       │
│  ├───────────────────────────────────────────┤       │
│  │         MCP Tool Registry                  │       │
│  └───────────────────────────────────────────┘       │
│                  MongoDB Database                     │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Real-time | Socket.IO |
| Styling | Custom CSS (Dark Theme) |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- [MongoDB Atlas](https://cloud.mongodb.com) account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file (copy from example):

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/agentflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Visit **http://localhost:5173** in your browser.

> 💡 Use **"Continue as Guest"** to explore without a database connection.

---

## 📁 Project Structure

```
agentflow/
├── backend/
│   ├── agents/          # AI Agent system
│   │   ├── orchestrator.js
│   │   ├── taskAgent.js
│   │   ├── calendarAgent.js
│   │   └── notesAgent.js
│   ├── mcp/             # Model Context Protocol
│   │   ├── registry.js
│   │   └── tools.js
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/       # Auth & error handling
│   ├── config/          # Database config
│   └── server.js        # Entry point
├── frontend/
│   └── src/
│       ├── components/  # Sidebar, Layout, Modal
│       ├── pages/       # Dashboard, Agent, Tasks, etc.
│       ├── context/     # Auth & Toast providers
│       ├── services/    # API client
│       └── styles/      # Global CSS
└── mobile/              # React Native (coming soon)
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/guest` | Guest login |
| GET | `/api/auth/me` | Current user |
| CRUD | `/api/tasks` | Task management |
| GET | `/api/tasks/stats/summary` | Task statistics |
| CRUD | `/api/events` | Event management |
| GET | `/api/events/upcoming/today` | Today's events |
| CRUD | `/api/notes` | Note management |
| POST | `/api/agent/execute` | AI agent command |
| GET | `/api/agent/logs` | Agent activity |
| POST | `/api/agent/workflow` | Run workflow |
| GET | `/api/dashboard/summary` | Dashboard data |
| GET | `/api/health` | Health check |

---

## 🤖 Agent Commands

Try these in the AI Agent chat:

```
"Create a task called Review PR with high priority"
"Show my tasks"
"Schedule a meeting tomorrow at 3pm"
"Create a note about project ideas"
"Plan my day"
"Summarize my week"
"Create a new project"
"Show upcoming events"
"Search notes for meeting"
```

---

## 🚀 Deployment

### Backend → [Render](https://render.com)
1. Push to GitHub
2. Create a **Web Service** on Render
3. Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`)
4. Deploy

### Frontend → [Vercel](https://vercel.com)
1. Import your GitHub repo on Vercel
2. Set root directory to `frontend`
3. Add env variable: `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy

### Database → [MongoDB Atlas](https://cloud.mongodb.com)
1. Create a free cluster
2. Whitelist `0.0.0.0/0` under **Network Access**
3. Create a DB user and copy the connection string

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Siddhesh](https://github.com/YOUR_USERNAME)
