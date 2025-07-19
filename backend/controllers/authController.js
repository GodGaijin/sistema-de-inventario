const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const emailService = require('../services/emailService');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRY = (user) => user.role === 'senior_admin' ? '24h' : '1h';
const REFRESH_TOKEN_EXPIRY = '2h';

const generateTokens = (user) => {
  const payload = { id: user.id, username: user.username, role: user.role };
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY(user) });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
};

exports.register = (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Nombre de usuario y contraseña requeridos.' });
  if (!email) return res.status(400).json({ message: 'Email requerido.' });
  
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'La contraseña debe contener al menos una letra, un número y un caracter especial.' });
  }
  
  userModel.findUserByUsername(username, (err, user) => {
    if (user) return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    
    userModel.findUserByEmail(email, (err, existingEmail) => {
      if (existingEmail) return res.status(409).json({ message: 'El email ya está registrado.' });
      
      // Todos los usuarios nuevos se registran como 'user' por defecto
      userModel.createUser(username, password, 'user', email, (err, userId) => {
        if (err) return res.status(500).json({ message: 'Error al crear el usuario.' });
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
      });
    });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  
  userModel.findUserByUsername(username, (err, user) => {
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas.' });
    
    // Manejo especial para admin senior
    if (user.role === 'senior_admin') {
      // Primero intentar validar la contraseña actual
      if (userModel.validatePassword(user, password)) {
        // Contraseña correcta, generar tokens y permitir acceso
        const tokens = generateTokens(user);
        res.json({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
        return;
      }
      
      // Contraseña incorrecta, generar nueva contraseña temporal
      userModel.generateSeniorAdminPassword((err, tempPassword) => {
        if (err) {
          console.error('Error generating senior admin password:', err);
          return res.status(500).json({ message: 'Error interno del servidor.' });
        }
        
        emailService.sendSeniorAdminPassword(user.email, tempPassword)
          .then(() => {
            res.status(401).json({ 
              message: `Contraseña incorrecta. Se ha enviado una nueva contraseña temporal a tu email. Usuario: admin_senior, Contraseña: ${tempPassword}` 
            });
          })
          .catch((error) => {
            console.error('Error sending senior admin password:', error);
            res.status(500).json({ message: 'Error al enviar la contraseña temporal.' });
          });
      });
      return;
    }
    
    // Validación normal para otros usuarios
    if (!userModel.validatePassword(user, password)) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    
    const tokens = generateTokens(user);
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Token de actualización requerido.' });
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token de actualización inválido.' });
    const tokens = generateTokens(user);
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email requerido.' });
  }
  
  userModel.findUserByEmail(email, (err, user) => {
    if (err) {
      console.error('Error finding user by email:', err);
      return res.status(500).json({ message: 'Error interno del servidor.' });
    }
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación.' });
    }
    
    // No permitir recuperación de contraseña para admin senior
    if (user.role === 'senior_admin') {
      return res.status(403).json({ message: 'No se permite recuperación de contraseña para esta cuenta.' });
    }
    
    userModel.generateResetToken(email, (err, resetToken) => {
      if (err) {
        console.error('Error generating reset token:', err);
        return res.status(500).json({ message: 'Error al generar el token de recuperación.' });
      }
      
      emailService.sendPasswordResetEmail(email, resetToken, user.username)
        .then(() => {
          res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación.' });
        })
        .catch((error) => {
          console.error('Error sending email:', error);
          res.status(500).json({ message: 'Error al enviar el email de recuperación.' });
        });
    });
  });
};

exports.resetPassword = (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token y nueva contraseña requeridos.' });
  }
  
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ message: 'La contraseña debe contener al menos una letra, un número y un caracter especial.' });
  }
  
  userModel.findUserByResetToken(token, (err, user) => {
    if (err) {
      console.error('Error finding user by reset token:', err);
      return res.status(500).json({ message: 'Error interno del servidor.' });
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado.' });
    }
    
    userModel.updatePassword(user.id, newPassword, (err, changes) => {
      if (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ message: 'Error al actualizar la contraseña.' });
      }
      
      if (changes === 0) {
        return res.status(500).json({ message: 'Error al actualizar la contraseña.' });
      }
      
      res.json({ message: 'Contraseña actualizada exitosamente.' });
    });
  });
};

// Nuevas funciones para gestión de usuarios (solo admin senior)
exports.getAllUsers = (req, res) => {
  // Verificar que el usuario sea admin senior
  if (req.user.role !== 'senior_admin') {
    return res.status(403).json({ message: 'Acceso denegado. Solo administradores senior pueden ver esta información.' });
  }
  
  userModel.getAllUsers((err, users) => {
    if (err) {
      console.error('Error getting users:', err);
      return res.status(500).json({ message: 'Error interno del servidor.' });
    }
    
    res.json(users);
  });
};

exports.updateUserRole = (req, res) => {
  const { userId, newRole } = req.body;
  
  // Verificar que el usuario sea admin senior
  if (req.user.role !== 'senior_admin') {
    return res.status(403).json({ message: 'Acceso denegado. Solo administradores senior pueden cambiar roles.' });
  }
  
  if (!userId || !newRole) {
    return res.status(400).json({ message: 'ID de usuario y nuevo rol requeridos.' });
  }
  
  if (!['user', 'admin'].includes(newRole)) {
    return res.status(400).json({ message: 'Rol inválido. Solo se permiten "user" y "admin".' });
  }
  
  userModel.updateUserRole(userId, newRole, (err, changes) => {
    if (err) {
      console.error('Error updating user role:', err);
      return res.status(500).json({ message: 'Error interno del servidor.' });
    }
    
    if (changes === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o no se puede cambiar el rol.' });
    }
    
    res.json({ message: 'Rol de usuario actualizado exitosamente.' });
  });
}; 