const { Pool } = require('pg');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    // Debug: Mostrar configuración
    console.log('🔍 Configuración de base de datos:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL configurada:', !!process.env.DATABASE_URL);
    console.log('SSL requerido:', process.env.NODE_ENV === 'production');
    
    // Usar PostgreSQL
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('✅ Pool de PostgreSQL creado');
  }

  // Método para ejecutar queries
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, result) => {
        if (err) {
          console.error('PostgreSQL Error:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Método para ejecutar queries que no retornan datos
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, result) => {
        if (err) {
          console.error('PostgreSQL Error:', err);
          reject(err);
        } else {
          resolve({ changes: result.rowCount });
        }
      });
    });
  }

  // Método para obtener una sola fila
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, result) => {
        if (err) {
          console.error('PostgreSQL Error:', err);
          reject(err);
        } else {
          resolve(result.rows[0] || null);
        }
      });
    });
  }

  // Método para cerrar la conexión
  close() {
    this.db.end();
  }

  // Método para inicializar las tablas
  async initTables() {
    try {
      // Crear tablas en PostgreSQL
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          reset_token VARCHAR(255),
          reset_token_expires TIMESTAMP
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS distributors (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          email VARCHAR(255) NOT NULL,
          rif VARCHAR(50) NOT NULL,
          location TEXT NOT NULL
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          stock INTEGER NOT NULL,
          category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
          distributor_id INTEGER REFERENCES distributors(id) ON DELETE RESTRICT
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS audits (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          username VARCHAR(255),
          action VARCHAR(100) NOT NULL,
          entity VARCHAR(100) NOT NULL,
          entity_id INTEGER,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS own_commerce (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          rif VARCHAR(50) NOT NULL,
          location TEXT NOT NULL,
          description TEXT
        )
      `);

      console.log('✅ Tablas PostgreSQL creadas/verificadas');
    } catch (error) {
      console.error('❌ Error inicializando tablas:', error);
      throw error;
    }
  }
}

module.exports = new Database(); 