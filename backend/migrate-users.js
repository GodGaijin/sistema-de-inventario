require('dotenv').config({ path: './config.env' });
const db = require('./models/database');

async function migrateUsers() {
  try {
    console.log('🔄 Iniciando migración de usuarios...');
    
    // Verificar si las nuevas columnas existen
    const checkColumns = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('is_email_verified', 'email_verification_token', 'last_verification_email_sent')
    `);
    
    if (checkColumns.rows.length < 3) {
      console.log('❌ Las nuevas columnas no existen. Ejecuta primero la inicialización de la base de datos.');
      return;
    }
    
    // Marcar admin_senior como verificado
    const seniorAdminEmail = process.env.SENIOR_ADMIN_EMAIL;
    if (seniorAdminEmail) {
      await db.run(`
        UPDATE users 
        SET is_email_verified = TRUE, 
            email_verification_token = NULL, 
            last_verification_email_sent = NOW()
        WHERE email = $1 AND role = 'senior_admin'
      `, [seniorAdminEmail]);
      
      console.log(`✅ Admin senior (${seniorAdminEmail}) marcado como verificado`);
    }
    
    // Obtener conteo de usuarios existentes
    const userCount = await db.query('SELECT COUNT(*) as count FROM users WHERE role != "senior_admin"');
    console.log(`📊 Total de usuarios existentes: ${userCount.rows[0].count}`);
    
    console.log('✅ Migración completada exitosamente');
    console.log('');
    console.log('📋 Resumen:');
    console.log('- Admin senior marcado como verificado');
    console.log('- Usuarios existentes mantendrán su estado actual');
    console.log('- Nuevos usuarios requerirán verificación de email');
    console.log('');
    console.log('⚠️  Nota: Los usuarios existentes deberán verificar su email en su próximo login');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar migración
migrateUsers(); 