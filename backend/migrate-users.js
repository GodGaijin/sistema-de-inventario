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
    
    console.log(`📊 Columnas encontradas: ${checkColumns.rows.length}`);
    
    // Si no existen las columnas, agregarlas con ALTER TABLE
    if (checkColumns.rows.length < 3) {
      console.log('📊 Agregando nuevas columnas a la tabla users...');
      
      try {
        // Agregar columna is_email_verified
        await db.run(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ Columna is_email_verified agregada');
        
        // Agregar columna email_verification_token
        await db.run(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255)
        `);
        console.log('✅ Columna email_verification_token agregada');
        
        // Agregar columna last_verification_email_sent
        await db.run(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS last_verification_email_sent TIMESTAMP
        `);
        console.log('✅ Columna last_verification_email_sent agregada');
        
      } catch (alterError) {
        console.error('❌ Error al agregar columnas:', alterError.message);
        return;
      }
    } else {
      console.log('✅ Las columnas ya existen');
    }
    
    // Verificar nuevamente que las columnas existen
    const finalCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('is_email_verified', 'email_verification_token', 'last_verification_email_sent')
    `);
    
    if (finalCheck.rows.length < 3) {
      console.log('❌ Las nuevas columnas no existen después de ALTER TABLE.');
      return;
    }
    
    console.log('✅ Nuevas columnas verificadas correctamente');
    
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
    const userCount = await db.query('SELECT COUNT(*) as count FROM users WHERE role != \'senior_admin\'');
    console.log(`📊 Total de usuarios existentes: ${userCount.rows[0].count}`);
    
    console.log('✅ Migración completada exitosamente');
    console.log('');
    console.log('📋 Resumen:');
    console.log('- Nuevas columnas agregadas a la tabla users');
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