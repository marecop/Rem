const express = require('express');
const db = require('../db');
const { validateBase64Image } = require('../utils/imageValidator');
const router = express.Router();

const authenticate = (req, res, next) => {
  // Reuse existing auth middleware logic or import it
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  const jwt = require('jsonwebtoken');
  const SECRET = process.env.JWT_SECRET || 'default_secret';
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};

// GET all contacts with pagination
router.get('/', authenticate, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50; // Default 50, max 100
  const actualLimit = Math.min(limit, 100);
  const offset = (page - 1) * actualLimit;
  
  // Get total count for pagination info
  const countStmt = db.prepare('SELECT COUNT(*) as total FROM contacts WHERE user_id = ?');
  const total = countStmt.get(req.user.id).total;
  
  const stmt = db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY name LIMIT ? OFFSET ?');
  const contacts = stmt.all(req.user.id, actualLimit, offset);
  
  res.json({
    contacts,
    pagination: {
      page,
      limit: actualLimit,
      total,
      totalPages: Math.ceil(total / actualLimit)
    }
  });
});

// CREATE contact
router.post('/', authenticate, (req, res) => {
  const { name, identity, tags, description, avatar_url } = req.body;
  
  // Validate avatar if provided
  if (avatar_url) {
    const validation = validateBase64Image(avatar_url);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
  }
  
  const stmt = db.prepare('INSERT INTO contacts (user_id, name, identity, tags, description, avatar_url) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, name, identity, tags, description, avatar_url);
  res.json({ id: info.lastInsertRowid, ...req.body });
});

// UPDATE contact
router.put('/:id', authenticate, (req, res) => {
    const { name, identity, tags, description, avatar_url } = req.body;
    
    // Validate avatar if provided
    if (avatar_url) {
      const validation = validateBase64Image(avatar_url);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    const stmt = db.prepare('UPDATE contacts SET name=?, identity=?, tags=?, description=?, avatar_url=? WHERE id=? AND user_id=?');
    stmt.run(name, identity, tags, description, avatar_url, req.params.id, req.user.id);
    res.json({ success: true });
});

// DELETE contact
router.delete('/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
