const { Pool } = require('pg');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    // Debug: Mostrar configuración
    
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada');
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Determinar si necesitamos SSL (Render o producción)
    const needsSSL = process.env.RENDER || 
                     process.env.NODE_ENV === 'production' || 
                     process.env.DATABASE_URL?.includes('render.com');
    // Configuración SSL
    const sslConfig = needsSSL ? { rejectUnauthorized: false } : false;
    
    // Usar PostgreSQL con configuración robusta
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      // Configuraciones adicionales para estabilidad
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20,
      // Manejo de errores de conexión
      allowExitOnIdle: true
    });
    
    // Manejar errores del pool
    this.db.on('error', (err) => {
      console.error('❌ Error en el pool de PostgreSQL:', err);
    });
    

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
          // Para PostgreSQL, manejar tanto rowCount como rows
          const response = { changes: result.rowCount };
          if (result.rows && result.rows.length > 0) {
            response.rows = result.rows;
            response.lastID = result.rows[0].id;
          }
          resolve(response);
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

      await this.run(`
        CREATE TABLE IF NOT EXISTS active_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          username VARCHAR(255) NOT NULL,
          refresh_token VARCHAR(500) NOT NULL,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla para solicitudes de inventario
      await this.run(`
        CREATE TABLE IF NOT EXISTS inventory_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          codigo_prod VARCHAR(100) NOT NULL,
          transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('entrada', 'salida', 'auto_consumo')),
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          description TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          rejection_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP
        )
      `);

      // Tabla para transacciones de inventario
      await this.run(`
        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id SERIAL PRIMARY KEY,
          codigo_de_transaccion VARCHAR(100) UNIQUE NOT NULL,
          fecha TIMESTAMP NOT NULL,
          codigo_prod VARCHAR(100) NOT NULL,
          nombre VARCHAR(255) NOT NULL,
          inventario_inicial INTEGER NOT NULL,
          entradas INTEGER DEFAULT 0,
          salidas INTEGER DEFAULT 0,
          auto_consumo INTEGER DEFAULT 0,
          inventario_final INTEGER NOT NULL,
          request_id INTEGER REFERENCES inventory_requests(id) ON DELETE SET NULL,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Índices para mejorar el rendimiento
      await this.run(`
        CREATE INDEX IF NOT EXISTS idx_inventory_requests_status ON inventory_requests(status);
        CREATE INDEX IF NOT EXISTS idx_inventory_requests_user_id ON inventory_requests(user_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_requests_product_id ON inventory_requests(product_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_transactions_fecha ON inventory_transactions(fecha);
        CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON inventory_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_transactions_codigo_prod ON inventory_transactions(codigo_prod);
      `);

  
    } catch (error) {
      console.error('❌ Error inicializando tablas:', error);
      throw error;
    }
  }
}

module.exports = new Database(); 