const db = require('./database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const findUserByUsername = async (username) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const findUserByEmail = async (email) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const createUser = async (username, password, role, email, registrationIP = null) => {
  try {
    console.log('Creating user with:', { username, role, email, registrationIP });
    
    // Validar datos de entrada
    if (!username || !password || !role || !email) {
      throw new Error('Todos los campos son requeridos para crear un usuario');
    }
    
    // Validar que el rol sea válido
    if (!['user', 'admin', 'senior_admin'].includes(role)) {
      throw new Error('Rol inválido');
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    console.log('Executing INSERT user query...');
    const result = await db.run(
      'INSERT INTO users (username, password, role, email, registration_ip) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username.trim(), hashedPassword, role, email.trim(), registrationIP]
    );
    
    console.log('INSERT user result:', result);
    
    // Extraer el ID del resultado
    let userId;
    if (result.rows && result.rows.length > 0) {
      userId = result.rows[0].id;
    } else if (result.lastID) {
      userId = result.lastID;
    } else {
      throw new Error('No se pudo obtener el ID del usuario creado');
    }
    
    console.log('User created with ID:', userId);
    return userId;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

const validatePassword = (user, password) => {
  return bcrypt.compareSync(password, user.password);
};

const findUserById = async (id) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const generateResetCode = async (email) => {
  try {
    // Generar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 900000); // 15 minutes from now
    
    await db.run(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [resetCode, resetCodeExpires.toISOString(), email]
    );
    
    return resetCode;
  } catch (error) {
    throw error;
  }
};

const findUserByResetCode = async (resetCode) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [resetCode]
    );
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const updatePassword = async (userId, newPassword) => {
  try {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const result = await db.run(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, userId]
    );
    return result.changes;
  } catch (error) {
    throw error;
  }
};

// Funciones para admin senior
const findOrCreateSeniorAdmin = async () => {
  try {
    const seniorAdminUsername = process.env.SENIOR_ADMIN_USERNAME || 'admin_senior';
    const seniorAdminEmail = process.env.SENIOR_ADMIN_EMAIL;
    
    if (!seniorAdminEmail) {
      throw new Error('SENIOR_ADMIN_EMAIL no configurado');
    }
    
    let user = await findUserByUsername(seniorAdminUsername);
    
    if (user) {
      return user;
    }
    
    // Crear admin senior si no existe
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = bcrypt.hashSync(tempPassword, 10);
    
    const userId = await db.run(
      'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING id',
      [seniorAdminUsername, hashedPassword, 'senior_admin', seniorAdminEmail]
    );
    
    // Retornar el usuario creado con la contraseña temporal
    const newUser = {
      id: userId.lastID || (userId.rows && userId.rows[0] ? userId.rows[0].id : null),
      username: seniorAdminUsername,
      password: tempPassword, // Contraseña temporal sin hashear
      role: 'senior_admin',
      email: seniorAdminEmail
    };
    
    return newUser;
  } catch (error) {
    throw error;
  }
};

const generateSeniorAdminPassword = async () => {
  try {
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = bcrypt.hashSync(tempPassword, 10);
    const seniorAdminUsername = process.env.SENIOR_ADMIN_USERNAME || 'admin_senior';
    
    await db.run(
      'UPDATE users SET password = $1 WHERE username = $2 AND role = $3',
      [hashedPassword, seniorAdminUsername, 'senior_admin']
    );
    
    return tempPassword;
  } catch (error) {
    throw error;
  }
};

const updateUserRole = async (userId, newRole) => {
  try {
    if (!['user', 'admin'].includes(newRole)) {
      throw new Error('Rol inválido');
    }
    
    const result = await db.run(
      'UPDATE users SET role = $1 WHERE id = $2 AND role != $3',
      [newRole, userId, 'senior_admin']
    );
    
    return result.changes;
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const result = await db.query('SELECT id, username, email, role FROM users ORDER BY username');
    return result.rows || result;
  } catch (error) {
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const result = await db.query('SELECT id, username, email, role FROM users WHERE id = $1', [userId]);
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const deleteUser = async (userId) => {
  try {
    const result = await db.run('DELETE FROM users WHERE id = $1 AND role != $2', [userId, 'senior_admin']);
    return result.changes > 0;
  } catch (error) {
    throw error;
  }
};

// Funciones para verificación de email
const generateEmailVerificationToken = async (email) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    
    await db.run(
      'UPDATE users SET email_verification_token = $1, last_verification_email_sent = $2 WHERE email = $3',
      [token, now.toISOString(), email]
    );
    
    return token;
  } catch (error) {
    throw error;
  }
};

const verifyEmailToken = async (token) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email_verification_token = $1',
      [token]
    );
    
    const user = result.rows ? result.rows[0] : result[0];
    
    if (!user) {
      return null;
    }
    
    // Marcar email como verificado y eliminar token
    await db.run(
      'UPDATE users SET is_email_verified = TRUE, email_verification_token = NULL WHERE id = $1',
      [user.id]
    );
    
    return user;
  } catch (error) {
    throw error;
  }
};

const canResendVerificationEmail = async (email) => {
  try {
    const result = await db.query(
      'SELECT last_verification_email_sent FROM users WHERE email = $1',
      [email]
    );
    
    const user = result.rows ? result.rows[0] : result[0];
    
    if (!user || !user.last_verification_email_sent) {
      return true; // Puede enviar si nunca se ha enviado
    }
    
    const lastSent = new Date(user.last_verification_email_sent);
    const now = new Date();
    const timeDiff = (now - lastSent) / 1000; // Diferencia en segundos
    
    return timeDiff >= 90; // Debe haber pasado al menos 90 segundos
  } catch (error) {
    throw error;
  }
};

const getTimeUntilCanResend = async (email) => {
  try {
    const result = await db.query(
      'SELECT last_verification_email_sent FROM users WHERE email = $1',
      [email]
    );
    
    const user = result.rows ? result.rows[0] : result[0];
    
    if (!user || !user.last_verification_email_sent) {
      return 0; // Puede enviar inmediatamente
    }
    
    const lastSent = new Date(user.last_verification_email_sent);
    const now = new Date();
    const timeDiff = (now - lastSent) / 1000; // Diferencia en segundos
    
    return Math.max(0, 90 - timeDiff); // Tiempo restante en segundos
  } catch (error) {
    throw error;
  }
};

const isEmailVerified = async (email) => {
  try {
    const result = await db.query(
      'SELECT is_email_verified FROM users WHERE email = $1',
      [email]
    );
    
    const user = result.rows ? result.rows[0] : result[0];
    return user ? user.is_email_verified : false;
  } catch (error) {
    throw error;
  }
};

const isSeniorAdmin = (email) => {
  return email === process.env.SENIOR_ADMIN_EMAIL;
};

// Funciones para gestión de intentos fallidos de login
const incrementFailedLoginAttempts = async (userId) => {
  try {
    const result = await db.query(
      'SELECT failed_login_attempts FROM users WHERE id = $1',
      [userId]
    );
    
    const user = result.rows ? result.rows[0] : result[0];
    const currentAttempts = user ? user.failed_login_attempts : 0;
    const newAttempts = currentAttempts + 1;
    
    let lockUntil = null;
    if (newAttempts >= 5) {
      // Bloquear cuenta por 30 minutos después de 5 intentos fallidos
      lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30);
    }
    
    await db.run(`
      UPDATE users 
      SET failed_login_attempts = $1, 
          last_failed_login = CURRENT_TIMESTAMP,
          account_locked_until = $2
      WHERE id = $3
    `, [newAttempts, lockUntil ? lockUntil.toISOString() : null, userId]);
    
    return { attempts: newAttempts, locked: !!lockUntil, lockUntil };
  } catch (error) {
    console.error('Error incrementing failed login attempts:', error);
    throw error;
  }
};

const resetFailedLoginAttempts = async (userId) => {
  try {
    await db.run(`
      UPDATE users 
      SET failed_login_attempts = 0, 
          last_failed_login = NULL,
          account_locked_until = NULL
      WHERE id = $1
    `, [userId]);
    
    return true;
  } catch (error) {
    console.error('Error resetting failed login attempts:', error);
    throw error;
  }
};

const updateLastLoginInfo = async (userId, ipAddress) => {
  try {
    await db.run(`
      UPDATE users 
      SET last_login_ip = $1, 
          last_login_timestamp = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [ipAddress, userId]);
    
    return true;
  } catch (error) {
    console.error('Error updating last login info:', error);
    throw error;
  }
};

// Funciones para obtener información de seguridad del usuario
const getUserSecurityInfo = async (userId) => {
  try {
    const result = await db.query(`
      SELECT 
        id, username, email, role,
        two_factor_enabled,
        account_suspended,
        suspension_reason,
        suspension_expires,
        failed_login_attempts,
        account_locked_until,
        registration_ip,
        last_login_ip,
        last_login_timestamp,
        created_at,
        is_email_verified
      FROM users WHERE id = $1
    `, [userId]);
    
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    console.error('Error getting user security info:', error);
    throw error;
  }
};

// Función para obtener todos los usuarios con información de seguridad (solo admin senior)
const getAllUsersWithSecurityInfo = async () => {
  try {
    const result = await db.query(`
      SELECT 
        id, username, email, role,
        two_factor_enabled,
        account_suspended,
        suspension_reason,
        suspension_expires,
        failed_login_attempts,
        account_locked_until,
        registration_ip,
        last_login_ip,
        last_login_timestamp,
        created_at,
        is_email_verified
      FROM users 
      ORDER BY username
    `);
    
    return result.rows || result;
  } catch (error) {
    console.error('Error getting all users with security info:', error);
    throw error;
  }
};

module.exports = {
  findUserByUsername,
  findUserByEmail,
  createUser,
  validatePassword,
  findUserById,
  generateResetCode,
  findUserByResetCode,
  updatePassword,
  findOrCreateSeniorAdmin,
  generateSeniorAdminPassword,
  updateUserRole,
  getAllUsers,
  getUserById,
  deleteUser,
  generateEmailVerificationToken,
  verifyEmailToken,
  canResendVerificationEmail,
  getTimeUntilCanResend,
  isEmailVerified,
  isSeniorAdmin,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
  updateLastLoginInfo,
  getUserSecurityInfo,
  getAllUsersWithSecurityInfo,
}; 