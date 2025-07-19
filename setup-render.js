#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando proyecto para Render...\n');

// Función para actualizar environment.prod.ts
function updateEnvironmentFile(backendUrl) {
  const envProdPath = path.join(__dirname, 'frontend', 'src', 'environments', 'environment.prod.ts');
  
  const content = `export const environment = {
  production: true,
  apiUrl: '${backendUrl}/api'
};`;

  fs.writeFileSync(envProdPath, content);
  console.log(`✅ Environment de producción actualizado: ${backendUrl}/api`);
  
  // También actualizar la variable FRONTEND_URL en el backend si es necesario
  console.log('💡 Recuerda actualizar FRONTEND_URL en Render con: https://inventory-frontend.onrender.com');
}

// Función para mostrar instrucciones
function showInstructions() {
  console.log('\n📋 INSTRUCCIONES PARA RENDER:\n');
  
  console.log('1️⃣  CREAR BASE DE DATOS POSTGRESQL:');
  console.log('   ✅ Ya creada: sistema-de-inventario');
  console.log('   ✅ URL: postgresql://admin:hCINTLj7YG0OfieH4dXoelOAlZKAyZVP@dpg-d1tu7a3e5dus73e0sau0-a.oregon-postgres.render.com/inventory_db_u4cl\n');
  
  console.log('2️⃣  CREAR BACKEND:');
  console.log('   - Tipo: Web Service');
  console.log('   - Plan: Free');
  console.log('   - Build Command: npm install');
  console.log('   - Start Command: node app.js');
  console.log('   - Puerto: 10000');
  console.log('   - Variables de entorno:');
  console.log('     • NODE_ENV=production');
  console.log('     • DATABASE_URL (se conecta automáticamente a la BD)');
  console.log('     • ACCESS_TOKEN_SECRET (se genera automáticamente)');
  console.log('     • REFRESH_TOKEN_SECRET (se genera automáticamente)\n');
  
  console.log('3️⃣  CREAR FRONTEND:');
  console.log('   - Tipo: Static Site');
  console.log('   - Plan: Free');
  console.log('   - Build Command: npm install && npm run build');
  console.log('   - Publish Directory: ./dist/frontend\n');
  
  console.log('4️⃣  CONFIGURAR CORS:');
  console.log('   - El backend ya está configurado para aceptar:');
  console.log('     • https://inventory-frontend.onrender.com');
  console.log('     • https://tu-frontend-url.onrender.com');
  console.log('     • http://localhost:4200 (desarrollo)\n');
  
  console.log('5️⃣  DESPUÉS DE CREAR LOS SERVICIOS:');
  console.log('   - Copia la URL del backend (ej: https://inventory-backend.onrender.com)');
  console.log('   - Ejecuta: node setup-render.js <backend-url>');
  console.log('   - Esto actualizará automáticamente el frontend\n');
  
  console.log('🔗 URLs ESPERADAS:');
  console.log('   - Backend: https://inventory-backend.onrender.com');
  console.log('   - Frontend: https://inventory-frontend.onrender.com');
  console.log('   - Base de datos: sistema-de-inventario (PostgreSQL)\n');
}

// Función principal
function main() {
  const backendUrl = process.argv[2];
  
  if (backendUrl) {
    console.log(`🔧 Configurando con backend URL: ${backendUrl}`);
    updateEnvironmentFile(backendUrl);
    console.log('\n✅ Configuración completada!');
    console.log('🚀 Ahora puedes hacer deploy del frontend.');
  } else {
    showInstructions();
  }
}

main(); 