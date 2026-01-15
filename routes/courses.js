const express = require('express');
const db = require('../db');

const router = express.Router();

// Middleware (duplicate, should be in a separate file really, but keeping it simple for single file reads)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  const jwt = require('jsonwebtoken');
  const SECRET = process.env.JWT_SECRET || 'default_secret';
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get schedule
router.get('/', authenticate, (req, res) => {
  const stmt = db.prepare('SELECT * FROM courses WHERE user_id = ? ORDER BY day_of_week, start_time');
  const courses = stmt.all(req.user.id);
  res.json(courses);
});

// Add course
router.post('/', authenticate, (req, res) => {
  const { name, day_of_week, start_time, end_time, location, teacher, color } = req.body;
  const stmt = db.prepare('INSERT INTO courses (user_id, name, day_of_week, start_time, end_time, location, teacher, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, name, day_of_week, start_time, end_time, location, teacher, color);
  res.json({ id: info.lastInsertRowid, ...req.body });
});

// Update course
router.put('/:id', authenticate, (req, res) => {
  const { name, day_of_week, start_time, end_time, location, teacher, color } = req.body;
  const stmt = db.prepare('UPDATE courses SET name = ?, day_of_week = ?, start_time = ?, end_time = ?, location = ?, teacher = ?, color = ? WHERE id = ? AND user_id = ?');
  const info = stmt.run(name, day_of_week, start_time, end_time, location, teacher, color, req.params.id, req.user.id);
  
  if (info.changes > 0) {
    res.json({ id: parseInt(req.params.id), ...req.body });
  } else {
    res.status(404).json({ error: 'Course not found' });
  }
});

// Delete course
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM courses WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
