const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Configurar conexiones
const sqlitePath = path.resolve(__dirname, './db/inventory.db');
const sqliteDb = new sqlite3.Database(sqlitePath);

const postgresDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('🔄 Iniciando migración de SQLite a PostgreSQL...');

async function migrateData() {
  try {
    // Migrar usuarios
    console.log('📦 Migrando usuarios...');
    const users = await querySqlite('SELECT * FROM users');
    for (const user of users) {
      await postgresDb.query(
        'INSERT INTO users (id, username, password, email, role, reset_token, reset_token_expires) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
        [user.id, user.username, user.password, user.email, user.role, user.reset_token, user.reset_token_expires]
      );
    }
    console.log(`✅ ${users.length} usuarios migrados`);

    // Migrar categorías
    console.log('📂 Migrando categorías...');
    const categories = await querySqlite('SELECT * FROM categories');
    for (const category of categories) {
      await postgresDb.query(
        'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [category.id, category.name, category.description]
      );
    }
    console.log(`✅ ${categories.length} categorías migradas`);

    // Migrar distribuidores
    console.log('🏢 Migrando distribuidores...');
    const distributors = await querySqlite('SELECT * FROM distributors');
    for (const distributor of distributors) {
      await postgresDb.query(
        'INSERT INTO distributors (id, name, contact, phone, email, rif, location) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
        [distributor.id, distributor.name, distributor.contact, distributor.phone, distributor.email, distributor.rif, distributor.location]
      );
    }
    console.log(`✅ ${distributors.length} distribuidores migrados`);

    // Migrar productos
    console.log('📦 Migrando productos...');
    const products = await querySqlite('SELECT * FROM products');
    for (const product of products) {
      await postgresDb.query(
        'INSERT INTO products (id, name, description, price, stock, category_id, distributor_id) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
        [product.id, product.name, product.description, product.price, product.stock, product.category_id, product.distributor_id]
      );
    }
    console.log(`✅ ${products.length} productos migrados`);

    // Migrar auditoría
    console.log('📋 Migrando auditoría...');
    const audits = await querySqlite('SELECT * FROM audits');
    for (const audit of audits) {
      await postgresDb.query(
        'INSERT INTO audits (id, user_id, username, action, entity, entity_id, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
        [audit.id, audit.user_id, audit.username, audit.action, audit.entity, audit.entity_id, audit.timestamp]
      );
    }
    console.log(`✅ ${audits.length} registros de auditoría migrados`);

    // Migrar datos del comercio
    console.log('🏪 Migrando datos del comercio...');
    const commerceData = await querySqlite('SELECT * FROM own_commerce');
    for (const commerce of commerceData) {
      await postgresDb.query(
        'INSERT INTO own_commerce (id, name, rif, location, description) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [commerce.id, commerce.name, commerce.rif, commerce.location, commerce.description]
      );
    }
    console.log(`✅ ${commerceData.length} registros de comercio migrados`);

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Usuarios: ${users.length}`);
    console.log(`   - Categorías: ${categories.length}`);
    console.log(`   - Distribuidores: ${distributors.length}`);
    console.log(`   - Productos: ${products.length}`);
    console.log(`   - Auditoría: ${audits.length}`);
    console.log(`   - Comercio: ${commerceData.length}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    // Cerrar conexiones
    sqliteDb.close();
    await postgresDb.end();
  }
}

function querySqlite(sql) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Ejecutar migración
migrateData(); 