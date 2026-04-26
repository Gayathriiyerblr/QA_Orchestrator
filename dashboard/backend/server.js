const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => {
  res.send('🚀 Antigravity AI Backend is running! Use port 5173 for the Dashboard.');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Serve artifacts (screenshots, reports)
app.use('/artifacts', express.static(path.join(__dirname, '../../artifacts')));

// API to get results
app.get('/api/results/:jiraId', (req, res) => {
  const { jiraId } = req.params;
  const filePath = path.join(__dirname, `../../artifacts/${jiraId}/results.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('update_status', (data) => {
    // Broadcast to all clients
    io.emit('status_changed', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Dashboard Backend running on http://localhost:${PORT}`);
});
