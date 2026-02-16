require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/collab-platform';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('Collaboration Platform API is running');
});

// Socket.IO
const users = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId, userName) => {
        if (!users[roomId]) users[roomId] = [];
        const isFirst = users[roomId].length === 0;
        const existingUser = users[roomId].find(u => u.id === socket.id);
        if (!existingUser) {
            users[roomId].push({ id: socket.id, name: userName || 'Anonymous', isAdmin: isFirst });
        }
        socket.join(roomId);
        socket.emit('admin-status', isFirst);
        socket.to(roomId).emit('user-connected', socket.id, userName);
        console.log(`[SERVER] User ${userName} (${socket.id}) joined room ${roomId}. Admin: ${isFirst}. Current users:`, users[roomId]);
    });

    socket.on('request-all-users', (roomId) => {
        const usersInRoom = (users[roomId] || []).filter(u => u.id !== socket.id);
        console.log(`[SERVER] User ${socket.id} requested all users for ${roomId}. Sending:`, usersInRoom);
        socket.emit('all-users', usersInRoom);
    });

    // Document Editing
    socket.on('send-changes', ({ roomId, content }) => {
        socket.to(roomId).emit('receive-changes', content);
    });

    socket.on('cursor-move', ({ roomId, cursor }) => {
        socket.to(roomId).emit('cursor-update', { userId: socket.id, cursor });
    });

    // Whiteboard
    socket.on('canvas-data', ({ roomId, data }) => {
        socket.to(roomId).emit('canvas-data', data);
    });

    socket.on('clear-canvas', ({ roomId }) => {
        socket.to(roomId).emit('clear-canvas');
    });

    // WebRTC Signaling (Simple mesh broadcast)
    socket.on('signal', ({ userToSignal, callerID, signal }) => {
        console.log(`[SIGNAL] From ${callerID} to ${userToSignal}`);
        io.to(userToSignal).emit('user-joined', { signal, callerID });
    });

    socket.on('returning-signal', ({ callerID, signal }) => {
        console.log(`[RETURNING-SIGNAL] Returning to ${callerID} from ${socket.id}`);
        io.to(callerID).emit('receiving-returned-signal', { signal, id: socket.id });
    });

    // View Synchronization
    socket.on('view-change', ({ roomId, view }) => {
        console.log(`[VIEW] User ${socket.id} changed view to ${view} in room ${roomId}`);
        socket.to(roomId).emit('view-update', view);
    });

    // Emoji Reactions
    socket.on('send-emoji', ({ roomId, emoji }) => {
        socket.to(roomId).emit('receive-emoji', emoji);
    });

    socket.on('start-sharing', ({ roomId }) => {
        socket.to(roomId).emit('user-started-sharing', socket.id);
    });

    socket.on('stop-sharing', ({ roomId }) => {
        socket.to(roomId).emit('user-stopped-sharing', socket.id);
    });

    socket.on('disconnect', () => {
        // Remove user from rooms
        for (const roomId in users) {
            if (users[roomId]) {
                const initialLen = users[roomId].length;
                users[roomId] = users[roomId].filter(u => u.id !== socket.id);
                if (users[roomId].length < initialLen) {
                    console.log(`[SERVER] User ${socket.id} removed from room ${roomId}`);
                    io.to(roomId).emit('user-disconnected', socket.id);
                }
            }
        }
        console.log('[SERVER] User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
