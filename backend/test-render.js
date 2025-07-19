// Script para probar configuración en Render
console.log('🔍 Verificando variables de entorno en Render...');

// Variables críticas
const criticalVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'SENIOR_ADMIN_EMAIL',
  'SENIOR_ADMIN_USERNAME'
];

console.log('\n📋 Variables de entorno:');
criticalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ Configurada' : '❌ No configurada';
  const displayValue = varName.includes('SECRET') || varName.includes('PASS') 
    ? (value ? '***' + value.slice(-4) : 'No configurada')
    : value || 'No configurada';
  
  console.log(`${varName}: ${status} - ${displayValue}`);
});

console.log('\n🔧 Configuración SSL:');
console.log('NODE_ENV === production:', process.env.NODE_ENV === 'production');
console.log('SSL configurado:', process.env.NODE_ENV === 'production' ? 'Sí (rejectUnauthorized: false)' : 'No');

// Probar conexión a PostgreSQL
if (process.env.DATABASE_URL) {
  console.log('\n🗄️ Probando conexión a PostgreSQL...');
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Error conectando a PostgreSQL:', err.message);
      console.error('Código:', err.code);
    } else {
      console.log('✅ Conexión exitosa a PostgreSQL');
      console.log('🕐 Hora del servidor:', res.rows[0].now);
    }
    pool.end();
  });
} else {
  console.log('\n❌ DATABASE_URL no configurada');
} 