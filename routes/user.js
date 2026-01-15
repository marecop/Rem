const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { validateBase64Image } = require('../utils/imageValidator');
const router = express.Router();

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET || 'default_secret';
    try { req.user = jwt.verify(token, SECRET); next(); } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};

// GET profile
router.get('/me', authenticate, (req, res) => {
    const user = db.prepare('SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
});

// UPDATE profile
router.put('/me', authenticate, async (req, res) => {
    const { display_name, avatar_url, password } = req.body;
    
    // Validate avatar if provided
    if (avatar_url) {
      const validation = validateBase64Image(avatar_url);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET display_name = ?, avatar_url = ?, password = ? WHERE id = ?')
          .run(display_name, avatar_url, hashedPassword, req.user.id);
    } else {
        db.prepare('UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?')
          .run(display_name, avatar_url, req.user.id);
    }
    
    const user = db.prepare('SELECT id, username, display_name, avatar_url FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
});

module.exports = router;
