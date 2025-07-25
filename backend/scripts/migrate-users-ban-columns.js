#!/usr/bin/env node
require('dotenv').config({ path: '../config.env' });
const db = require('../models/database');

(async () => {
  try {
    console.log('🔄 Ejecutando migración de columnas de baneo en tabla users...');
    await db.migrateUsersTable();
    console.log('✅ Migración completada.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en la migración:', err);
    process.exit(1);
  }
})(); 