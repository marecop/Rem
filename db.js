const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'app.db');
// Memory optimization: Disable verbose logging in production
// Set NODE_ENV=production to disable verbose mode
const db = new Database(dbPath, { 
  verbose: process.env.NODE_ENV !== 'production' ? console.log : null 
});

// Initialize tables
const initDb = () => {
  // Users table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Courses table (Schedule)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      day_of_week INTEGER NOT NULL, -- 1 = Monday, 5 = Friday
      start_time TEXT NOT NULL, -- HH:mm format
      end_time TEXT NOT NULL, -- HH:mm format
      location TEXT,
      teacher TEXT,
      color TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `).run();

  // Tasks table (Todo, Homework)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- 'homework', 'task'
      start_date DATETIME, 
      due_date DATETIME, 
      completed BOOLEAN DEFAULT 0,
      description TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `).run();

  // Contacts table (People)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      identity TEXT, -- e.g., "Classmate", "Teacher"
      tags TEXT, -- Comma separated tags
      description TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `).run();

  // Thoughts table (Journal/Ideas)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS thoughts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_contact_id INTEGER, -- Optional link to a person
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (related_contact_id) REFERENCES contacts (id)
    )
  `).run();
  
  // Migrations (Run if columns don't exist)
  try { db.prepare('ALTER TABLE tasks ADD COLUMN start_date DATETIME').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE courses ADD COLUMN teacher TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE users ADD COLUMN display_name TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE users ADD COLUMN avatar_url TEXT').run(); } catch (e) {}

  console.log('Database initialized');
};

initDb();

module.exports = db;
