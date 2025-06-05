
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const path = require('path');

const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users'); // Remove or comment out since users route file does not exist
const courseRoutes = require('./routes/courses');
const forumRoutes = require('./routes/forum');
const adminRoutes = require('./routes/admin');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and socket.io server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }
});

// Middleware example: simple logger
const loggerMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

app.use(loggerMiddleware);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for uploads folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/learning_platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Attach io to app for access in controllers
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', courseRoutes);
app.use('/api/forum', forumRoutes);
app.get('/api/forum', (req, res) => {
  res.status(404).json({ message: 'Use /api/forum/discussions endpoint' });
});
app.use('/api/admin', adminRoutes);

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Interactive Learning Platform API');
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'שגיאה בשרת', error: err.message, stack: err.stack });
});

// Start server with socket.io
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, upload, io };
