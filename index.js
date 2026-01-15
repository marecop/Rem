require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const courseRoutes = require('./routes/courses');
const contactRoutes = require('./routes/contacts');
const thoughtRoutes = require('./routes/thoughts');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; 

// Memory optimization: Limit body size to 2MB (reduced from 10MB)
// Base64 images should be compressed before upload
app.use(cors());
app.use(bodyParser.json({limit: '2mb'})); // Reduced limit to prevent memory issues

// Middleware to validate and limit base64 image size
app.use((req, res, next) => {
  // Check avatar_url in request body if present
  if (req.body && req.body.avatar_url) {
    const avatarUrl = req.body.avatar_url;
    // Base64 string length check (500KB base64 ≈ 375KB image)
    // Typical base64: 1.33x original size, so 500KB base64 ≈ 375KB image
    const MAX_BASE64_SIZE = 500 * 1024; // 500KB
    
    if (avatarUrl.length > MAX_BASE64_SIZE) {
      return res.status(400).json({ 
        error: 'Avatar image too large. Maximum size: 375KB (500KB base64)' 
      });
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/thoughts', thoughtRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Agenda+ API' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
