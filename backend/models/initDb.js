const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/inventory.db');
const db = new sqlite3.Database(dbPath);

// Users table: id, username, password, role
// Products: id, product_name, serial_number, product_details, price, amount, commerce_name, category_name
// Distributors: id, commerce_name, location
// Product_category: id_category, category_name, category_details

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  
  // Users table - Updated to include email and password reset fields
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'admin', 'senior_admin')),
    reset_token TEXT,
    reset_token_expires DATETIME
  )`);

  // Categories table (renamed from product_category)
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  )`);

  // Distributors table (updated fields)
  db.run(`CREATE TABLE IF NOT EXISTS distributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    rif TEXT NOT NULL,
    location TEXT NOT NULL
  )`);

  // Products table (updated fields to match frontend)
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    distributor_id INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE RESTRICT
  )`);

  // Audits table
  db.run(`CREATE TABLE IF NOT EXISTS audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Own commerce table
  db.run(`CREATE TABLE IF NOT EXISTS own_commerce (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rif TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT
  )`);
});

module.exports = db; 