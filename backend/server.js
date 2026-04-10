require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { registerAllTools } = require('./mcp/tools');

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time updates
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'AgentFlow API',
    version: '1.0.0'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'AgentFlow API',
    version: '1.0.0',
    description: 'Multi-Agent AI Task Management System',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      events: '/api/events',
      notes: '/api/notes',
      agent: '/api/agent',
      dashboard: '/api/dashboard'
    }
  });
});

// Error handler
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('agent:command', async (data) => {
    const { command, userId } = data;
    try {
      socket.emit('agent:status', { status: 'processing', command });
      
      const orchestrator = require('./agents/orchestrator');
      const result = await orchestrator.execute(command, { userId });
      
      socket.emit('agent:result', result);
      io.to(userId).emit('agent:update', result);
    } catch (error) {
      socket.emit('agent:error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database
  await connectDB();

  // Register MCP tools
  registerAllTools();

  server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║     🤖 AgentFlow API Server          ║
    ║     Running on port ${PORT}              ║
    ║     Mode: ${process.env.NODE_ENV || 'development'}            ║
    ╚═══════════════════════════════════════╝
    `);
  });
};

startServer();
