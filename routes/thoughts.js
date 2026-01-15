const express = require('express');
const db = require('../db');
const router = express.Router();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  const jwt = require('jsonwebtoken');
  const SECRET = process.env.JWT_SECRET || 'default_secret';
  try { req.user = jwt.verify(token, SECRET); next(); } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};

// GET all thoughts with pagination
router.get('/', authenticate, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50; // Default 50, max 100
  const actualLimit = Math.min(limit, 100);
  const offset = (page - 1) * actualLimit;
  
  // Get total count for pagination info
  const countStmt = db.prepare('SELECT COUNT(*) as total FROM thoughts WHERE user_id = ?');
  const total = countStmt.get(req.user.id).total;
  
  const stmt = db.prepare(`
    SELECT t.*, c.name as contact_name 
    FROM thoughts t 
    LEFT JOIN contacts c ON t.related_contact_id = c.id 
    WHERE t.user_id = ? 
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `);
  const thoughts = stmt.all(req.user.id, actualLimit, offset);
  
  res.json({
    thoughts,
    pagination: {
      page,
      limit: actualLimit,
      total,
      totalPages: Math.ceil(total / actualLimit)
    }
  });
});

// CREATE thought
router.post('/', authenticate, (req, res) => {
  const { title, content, related_contact_id } = req.body;
  const stmt = db.prepare('INSERT INTO thoughts (user_id, title, content, related_contact_id) VALUES (?, ?, ?, ?)');
  const info = stmt.run(req.user.id, title, content, related_contact_id);
  res.json({ id: info.lastInsertRowid, title, content, related_contact_id, created_at: new Date() });
});

// DELETE thought
router.delete('/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM thoughts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
