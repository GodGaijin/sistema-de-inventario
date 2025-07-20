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

const createUser = async (username, password, role, email) => {
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await db.run(
      'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, hashedPassword, role, email]
    );
    return result.lastID || result.rows[0].id;
  } catch (error) {
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

const generateResetToken = async (email) => {
  try {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    await db.run(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [resetToken, resetTokenExpires.toISOString(), email]
    );
    
    return resetToken;
  } catch (error) {
    throw error;
  }
};

const findUserByResetToken = async (resetToken) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [resetToken]
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
      id: userId.lastID || userId.rows[0].id,
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

module.exports = {
  findUserByUsername,
  findUserByEmail,
  createUser,
  validatePassword,
  findUserById,
  generateResetToken,
  findUserByResetToken,
  updatePassword,
  findOrCreateSeniorAdmin,
  generateSeniorAdminPassword,
  updateUserRole,
  getAllUsers,
}; 