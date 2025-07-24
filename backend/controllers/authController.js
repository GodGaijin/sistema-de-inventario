const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const emailService = require('../services/emailService');
const sessionModel = require('../models/sessionModel');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET environment variable is required');
}
if (!REFRESH_TOKEN_SECRET) {
  throw new Error('REFRESH_TOKEN_SECRET environment variable is required');
}
// Nuevo sistema de tokens: 30 minutos para access token, 1 hora para refresh token
const ACCESS_TOKEN_EXPIRY = '30m'; // 30 minutos para todos los usuarios
const REFRESH_TOKEN_EXPIRY = '1h'; // 1 hora para refresh token

const generateTokens = (user) => {
  const payload = { id: user.id, username: user.username, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const securityModel = require('../models/securityModel');
    
    // Validación de datos de entrada
    if (!username || !password) {
      return res.status(400).json({ message: 'Nombre de usuario y contraseña requeridos.' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email requerido.' });
    }
    
    // Validar formato de email con regex más estricto
    // Validando email
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const regexTest = emailRegex.test(email);
    
    
    if (!regexTest) {
      // Email inválido (regex)
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    // Validaciones adicionales
    // Validaciones adicionales
    
    if (email.includes('..')) {
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    if (email.includes('@@')) {
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    if (email.includes(' ')) {
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    // Validar que no empiece o termine con punto o @
    if (email.startsWith('.')) {
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    if (email.endsWith('.')) {
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    if (email.startsWith('@')) {
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    if (email.endsWith('@')) {
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    // Validar que tenga al menos un punto después del @
    const atIndex = email.indexOf('@');
    const domainPart = email.substring(atIndex + 1);
    
    
    if (!domainPart.includes('.')) {
      return res.status(400).json({ message: 'Formato de email inválido.' });
    }
    
    // Validar longitud de username
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ message: 'El nombre de usuario debe tener entre 3 y 50 caracteres.' });
    }
    
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe contener al menos una letra, un número y un caracter especial.' });
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await userModel.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }
    
    // Verificar si el email ya existe
    const existingEmail = await userModel.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: 'El email ya está registrado.' });
    }
    
    // Obtener IP de registro
    const registrationIP = securityModel.getClientIP(req);
    
    // Crear el usuario
    const userId = await userModel.createUser(username, password, 'user', email, registrationIP);
    
    if (!userId) {
      throw new Error('No se pudo crear el usuario');
    }
    
    // Registrar intento de registro exitoso
    await securityModel.logRegistrationAttempt(registrationIP, email, username, true);
    
    // Generar token de verificación y enviar email
    try {
      const verificationToken = await userModel.generateEmailVerificationToken(email);
      await emailService.sendEmailVerification(email, verificationToken, username);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // No fallar el registro si el email falla, pero loguear el error
    }
    
    // Usuario registrado exitosamente
    res.status(201).json({ message: 'Usuario registrado exitosamente. Por favor, verifica tu email para completar el registro.' });
    
  } catch (error) {
    console.error('❌ Error in register:', error);
    
    // Manejar errores específicos de la base de datos
    if (error.code === '23505') { // Unique violation
      if (error.constraint && error.constraint.includes('username')) {
        return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
      }
      if (error.constraint && error.constraint.includes('email')) {
        return res.status(409).json({ message: 'El email ya está registrado.' });
      }
      return res.status(409).json({ message: 'Datos duplicados.' });
    }
    
    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ message: 'Datos incompletos para crear el usuario.' });
    }
    
    res.status(500).json({ 
      message: 'Error al crear el usuario.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const securityModel = require('../models/securityModel');
    
    const user = await userModel.findUserByUsername(username);
    if (!user) {
      // Registrar intento fallido
      await securityModel.logSecurityEvent(req, 'login_failed', {
        username,
        reason: 'user_not_found'
      });
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    
    // Manejo especial para admin senior
    if (user.role === 'senior_admin') {
      // Primero intentar validar la contraseña actual
      if (userModel.validatePassword(user, password)) {
        // Contraseña correcta, generar tokens y permitir acceso
        const tokens = generateTokens(user);
        
        // Registrar sesión activa
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        await sessionModel.createOrUpdateSession(user.id, user.username, tokens.refreshToken, ipAddress, userAgent);
        
        res.json({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
        return;
      }
      
      // Contraseña incorrecta, generar nueva contraseña temporal
      const tempPassword = await userModel.generateSeniorAdminPassword();
      
      try {
        await emailService.sendSeniorAdminPassword(user.email, tempPassword);
        res.status(401).json({ 
          message: `Contraseña incorrecta. Se ha enviado una nueva contraseña temporal a tu email.` 
        });
      } catch (error) {
        console.error('Error sending senior admin password:', error);
        res.status(500).json({ message: 'Error al enviar la contraseña temporal.' });
      }
      return;
    }
    
    // Validación normal para otros usuarios
    if (!userModel.validatePassword(user, password)) {
      // Incrementar intentos fallidos
      const failedAttempts = await userModel.incrementFailedLoginAttempts(user.id);
      
      // Registrar intento fallido
      await securityModel.logSecurityEvent(req, 'login_failed', {
        username,
        reason: 'invalid_password',
        failedAttempts: failedAttempts.attempts
      });
      
      // Si la cuenta está bloqueada, enviar email de alerta
      if (failedAttempts.locked) {
        try {
          const emailService = require('../services/emailService');
          await emailService.sendSecurityAlertEmail(
            user.email,
            user.username,
            'multiple_failed_attempts',
            {
              attempts: failedAttempts.attempts,
              ip: securityModel.getClientIP(req)
            }
          );
        } catch (emailError) {
          console.error('Error sending security alert email:', emailError);
        }
      }
      
      return res.status(401).json({ 
        message: 'Credenciales inválidas.',
        locked: failedAttempts.locked,
        lockUntil: failedAttempts.lockUntil
      });
    }
    
    // Verificar si el email está verificado (excepto para admin_senior)
    if (!userModel.isSeniorAdmin(user.email)) {
      const emailVerified = await userModel.isEmailVerified(user.email);
      
      if (!emailVerified) {
        return res.status(403).json({ 
          message: 'Debes verificar tu email antes de acceder al sistema.',
          emailNotVerified: true,
          email: user.email
        });
      }
    }
    
    // Resetear intentos fallidos y actualizar información de login
    await userModel.resetFailedLoginAttempts(user.id);
    const ipAddress = securityModel.getClientIP(req);
    await userModel.updateLastLoginInfo(user.id, ipAddress);
    
    // Verificar si requiere 2FA por IP no conocida
    const requires2FA = await securityModel.require2FAForUnknownIP(user.id, ipAddress);
    
    if (requires2FA) {
      // Registrar evento de 2FA requerido
      await securityModel.logSecurityEvent(req, '2fa_required_unknown_ip', {
        username: user.username,
        ip: ipAddress,
        reason: 'unknown_ip'
      });
      
      return res.status(200).json({
        requires2FA: true,
        message: 'Se requiere verificación 2FA para acceder desde esta ubicación.',
        tempToken: jwt.sign(
          { id: user.id, username: user.username, requires2FA: true },
          process.env.JWT_SECRET,
          { expiresIn: '5m' }
        )
      });
    }
    
    const tokens = generateTokens(user);
    
    // Registrar sesión activa
    const userAgent = req.get('User-Agent');
    await sessionModel.createOrUpdateSession(user.id, user.username, tokens.refreshToken, ipAddress, userAgent);
    
    // Registrar login exitoso
    await securityModel.logSecurityEvent(req, 'login_success', {
      username: user.username,
      ip: ipAddress
    }, user.id);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Endpoint para verificar 2FA durante el login
exports.verify2FALogin = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    
    if (!tempToken || !code) {
      return res.status(400).json({ message: 'Token temporal y código 2FA requeridos.' });
    }
    
    // Verificar token temporal
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.requires2FA) {
      return res.status(400).json({ message: 'Token inválido.' });
    }
    
    const userId = decoded.id;
    
    // Verificar código 2FA
    const isValid = await securityModel.verifyTwoFactorCode(userId, code);
    if (!isValid) {
      return res.status(401).json({ message: 'Código 2FA inválido.' });
    }
    
    // Obtener usuario actualizado
    const user = await userModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Generar tokens finales
    const tokens = generateTokens(user);
    
    // Registrar sesión activa
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    await sessionModel.createOrUpdateSession(user.id, user.username, tokens.refreshToken, ipAddress, userAgent);
    
    // Registrar login exitoso con 2FA
    await securityModel.logSecurityEvent(req, 'login_success_2fa', {
      username: user.username,
      ip: ipAddress,
      method: '2fa_verification'
    }, user.id);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error in verify2FALogin:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token temporal inválido o expirado.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Token de actualización requerido.' });
    
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, user) => {
      if (err) return res.status(403).json({ message: 'Token de actualización inválido.' });
      
      // Verificar que la sesión existe en la base de datos
      const session = await sessionModel.getSessionByToken(refreshToken);
      if (!session) {
        return res.status(403).json({ message: 'Sesión no encontrada.' });
      }
      
      // Actualizar actividad de la sesión
      await sessionModel.updateSessionActivity(user.id);
      
      const tokens = generateTokens(user);
      
      // Actualizar el refresh token en la base de datos
      await sessionModel.removeSessionByToken(refreshToken);
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      await sessionModel.createOrUpdateSession(user.id, user.username, tokens.refreshToken, ipAddress, userAgent);
      
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
  } catch (error) {
    console.error('Error in refreshToken:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Nuevo endpoint para verificar si el usuario quiere continuar
exports.checkSession = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Token de actualización requerido.' });
    
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, user) => {
      if (err) {
        // Refresh token expirado, sesión completamente terminada
        return res.status(403).json({ 
          message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
          sessionExpired: true 
        });
      }
      
      // Verificar que la sesión existe en la base de datos
      const session = await sessionModel.getSessionByToken(refreshToken);
      if (!session) {
        return res.status(403).json({ 
          message: 'Sesión no encontrada.',
          sessionExpired: true 
        });
      }
      
      // Actualizar actividad de la sesión
      await sessionModel.updateSessionActivity(user.id);
      
      // Refresh token válido, generar nuevos tokens
      const tokens = generateTokens(user);
      
      // Actualizar el refresh token en la base de datos
      await sessionModel.removeSessionByToken(refreshToken);
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      await sessionModel.createOrUpdateSession(user.id, user.username, tokens.refreshToken, ipAddress, userAgent);
      
      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        sessionExpired: false
      });
    });
  } catch (error) {
    console.error('Error in checkSession:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requerido.' });
    }
    
    const user = await userModel.findUserByEmail(email);
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación.' });
    }
    
    // No permitir recuperación de contraseña para admin senior
    if (user.role === 'senior_admin') {
      return res.status(403).json({ message: 'No se permite recuperación de contraseña para esta cuenta.' });
    }
    
    const resetCode = await userModel.generateResetCode(email);
    
    try {
      await emailService.sendPasswordResetEmail(email, resetCode, user.username);
      res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación.' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Error al enviar el email de recuperación.' });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { code, newPassword } = req.body;
    
    if (!code || !newPassword) {
      return res.status(400).json({ message: 'Código de verificación y nueva contraseña requeridos.' });
    }
    
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'La contraseña debe contener al menos una letra, un número y un caracter especial.' });
    }
    
    const user = await userModel.findUserByResetCode(code);
    
    if (!user) {
      return res.status(400).json({ message: 'Código de verificación inválido o expirado.' });
    }
    
    const changes = await userModel.updatePassword(user.id, newPassword);
    
    if (changes === 0) {
      return res.status(500).json({ message: 'Error al actualizar la contraseña.' });
    }
    
    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Nuevas funciones para gestión de usuarios (solo admin senior)
exports.getAllUsers = async (req, res) => {
  try {
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores senior pueden ver esta información.' });
    }
    
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Función para obtener estadísticas de usuarios activos
exports.getActiveUsersStats = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado.' });
    }
    
    // Obtener conteo de usuarios activos
    const activeUsersCount = await sessionModel.getActiveUsersCount();
    
    // Obtener lista de usuarios activos (solo para admin y senior admin)
    let activeUsers = [];
    if (req.user.role === 'admin' || req.user.role === 'senior_admin') {
      activeUsers = await sessionModel.getActiveUsers();
    }
    
    res.json({
      activeUsersCount,
      activeUsers: req.user.role === 'admin' || req.user.role === 'senior_admin' ? activeUsers : []
    });
  } catch (error) {
    console.error('Error getting active users stats:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Función para logout (eliminar sesión)
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Token de actualización requerido.' });
    }
    
    // Eliminar sesión de la base de datos
    await sessionModel.removeSessionByToken(refreshToken);
    
    res.json({ message: 'Sesión cerrada exitosamente.' });
  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
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
    
    const changes = await userModel.updateUserRole(userId, newRole);
    
    if (changes === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o no se puede cambiar el rol.' });
    }
    
    res.json({ message: 'Rol de usuario actualizado exitosamente.' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Función para eliminar usuario (solo admin senior)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores senior pueden eliminar usuarios.' });
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario requerido.' });
    }
    
    // Verificar que no se esté eliminando a sí mismo
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' });
    }
    
    // Verificar que el usuario a eliminar existe y obtener su información
    const userToDelete = await userModel.getUserById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Verificar que no se esté eliminando a otro admin senior
    if (userToDelete.role === 'senior_admin') {
      return res.status(400).json({ message: 'No se pueden eliminar cuentas de administradores senior.' });
    }
    
    // Eliminar sesiones activas del usuario
    await sessionModel.removeSession(parseInt(userId));
    
    // Eliminar el usuario
    const deleted = await userModel.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Función mejorada para obtener usuarios activos con roles
exports.getActiveUsersWithRoles = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado.' });
    }
    
    // Solo admin y senior admin pueden ver usuarios activos
    if (req.user.role !== 'admin' && req.user.role !== 'senior_admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver esta información.' });
    }
    
    // Obtener usuarios activos con información de roles
    const activeUsers = await sessionModel.getActiveUsersWithRoles();
    
    res.json({
      activeUsersCount: activeUsers.length,
      activeUsers
    });
  } catch (error) {
    console.error('Error getting active users with roles:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}; 

// Función para verificar email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Token de verificación requerido.' });
    }
    
    const user = await userModel.verifyEmailToken(token);
    
    if (!user) {
      return res.status(400).json({ message: 'Token de verificación inválido o expirado.' });
    }
    
    res.json({ 
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión en el sistema.',
      verified: true
    });
  } catch (error) {
    console.error('Error in verifyEmail:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Función para reenviar email de verificación
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requerido.' });
    }
    
    const user = await userModel.findUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Verificar si ya está verificado
    if (user.is_email_verified) {
      return res.status(400).json({ message: 'Este email ya está verificado.' });
    }
    
    // Verificar si puede reenviar (timer de 90 segundos)
    const canResend = await userModel.canResendVerificationEmail(email);
    
    if (!canResend) {
      const timeRemaining = await userModel.getTimeUntilCanResend(email);
      return res.status(429).json({ 
        message: `Debes esperar ${Math.ceil(timeRemaining)} segundos antes de solicitar otro email de verificación.`,
        timeRemaining: Math.ceil(timeRemaining)
      });
    }
    
    // Generar nuevo token y enviar email
    const verificationToken = await userModel.generateEmailVerificationToken(email);
    await emailService.sendEmailVerification(email, verificationToken, user.username);
    
    res.json({ 
      message: 'Email de verificación enviado exitosamente. Revisa tu bandeja de entrada.',
      sent: true
    });
  } catch (error) {
    console.error('Error in resendVerificationEmail:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Función para verificar si un usuario puede reenviar email
exports.checkResendVerificationStatus = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requerido.' });
    }
    
    const user = await userModel.findUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Verificar si ya está verificado
    if (user.is_email_verified) {
      return res.json({ 
        canResend: false, 
        message: 'Email ya verificado',
        timeRemaining: 0 
      });
    }
    
    // Verificar si puede reenviar
    const canResend = await userModel.canResendVerificationEmail(email);
    const timeRemaining = await userModel.getTimeUntilCanResend(email);
    
    res.json({
      canResend,
      timeRemaining: Math.ceil(timeRemaining),
      message: canResend ? 'Puede reenviar email' : `Debe esperar ${Math.ceil(timeRemaining)} segundos`
    });
  } catch (error) {
    console.error('Error in checkResendVerificationStatus:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  register: exports.register,
  login: exports.login,
  refreshToken: exports.refreshToken,
  checkSession: exports.checkSession,
  forgotPassword: exports.forgotPassword,
  resetPassword: exports.resetPassword,
  getAllUsers: exports.getAllUsers,
  getActiveUsersStats: exports.getActiveUsersStats,
  logout: exports.logout,
  updateUserRole: exports.updateUserRole,
  deleteUser: exports.deleteUser,
  getActiveUsersWithRoles: exports.getActiveUsersWithRoles,
  verifyEmail: exports.verifyEmail,
  resendVerificationEmail: exports.resendVerificationEmail,
  checkResendVerificationStatus: exports.checkResendVerificationStatus
}; 