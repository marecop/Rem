const express = require('express');
const db = require('../db');

const router = express.Router();

// Middleware to verify token (simplified)
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

// Get all tasks with optional pagination
router.get('/', authenticate, (req, res) => {
  // For tasks, we might want all of them, but add pagination option
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  
  if (page && limit) {
    // Paginated request
    const actualLimit = Math.min(limit, 100);
    const offset = (page - 1) * actualLimit;
    
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM tasks WHERE user_id = ?');
    const total = countStmt.get(req.user.id).total;
    
    const stmt = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC LIMIT ? OFFSET ?');
    const tasks = stmt.all(req.user.id, actualLimit, offset);
    
    res.json({
      tasks,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit)
      }
    });
  } else {
    // Return all tasks (for backward compatibility, but limit to 500)
    const stmt = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC LIMIT 500');
    const tasks = stmt.all(req.user.id);
    res.json(tasks);
  }
});

// Create task
router.post('/', authenticate, (req, res) => {
  const { title, type, start_date, due_date, description } = req.body;
  const stmt = db.prepare('INSERT INTO tasks (user_id, title, type, start_date, due_date, description) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, title, type, start_date, due_date, description);
  res.json({ id: info.lastInsertRowid, title, type, start_date, due_date, description, completed: 0 });
});

// Toggle complete
router.patch('/:id/toggle', authenticate, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('UPDATE tasks SET completed = NOT completed WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true });
});

// Delete task
router.put('/:id', authenticate, (req, res) => {
  const { title, type, start_date, due_date, description } = req.body;
  const stmt = db.prepare('UPDATE tasks SET title = ?, type = ?, start_date = ?, due_date = ?, description = ? WHERE id = ? AND user_id = ?');
  const info = stmt.run(title, type, start_date, due_date, description, req.params.id, req.user.id);
  
  if (info.changes > 0) {
    res.json({ id: parseInt(req.params.id), ...req.body });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true });
});

module.exports = router;
