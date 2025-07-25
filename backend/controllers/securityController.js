const securityModel = require('../models/securityModel');
const userModel = require('../models/userModel');
const emailService = require('../services/emailService');

// Controlador para 2FA
exports.setupTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verificar que el usuario no tenga 2FA ya habilitado
    const user = await userModel.getUserSecurityInfo(userId);
    if (user.two_factor_enabled) {
      return res.status(400).json({ 
        message: 'La autenticación de dos factores ya está habilitada.' 
      });
    }
    
    // Generar secreto y códigos de respaldo
    const twoFactorData = await securityModel.generateTwoFactorSecret(userId);
    
    res.json({
      message: 'Configuración de 2FA generada exitosamente.',
      qrCode: twoFactorData.qrCode,
      backupCodes: twoFactorData.backupCodes,
      secret: twoFactorData.secret // Solo para mostrar al usuario una vez
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ message: 'Error al configurar la autenticación de dos factores.' });
  }
};

exports.verifyTwoFactorSetup = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(400).json({ message: 'Código de verificación requerido.' });
    }
    
    const isValid = await securityModel.verifyTwoFactorCode(userId, code);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Código de verificación inválido.' });
    }
    
    // Habilitar 2FA
    await securityModel.enableTwoFactor(userId);
    
    res.json({ 
      message: 'Autenticación de dos factores habilitada exitosamente.',
      enabled: true
    });
  } catch (error) {
    console.error('Error verifying 2FA setup:', error);
    res.status(500).json({ message: 'Error al verificar la configuración de 2FA.' });
  }
};

exports.disableTwoFactor = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(400).json({ message: 'Código de verificación requerido.' });
    }
    
    const isValid = await securityModel.verifyTwoFactorCode(userId, code);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Código de verificación inválido.' });
    }
    
    // Deshabilitar 2FA
    await securityModel.disableTwoFactor(userId);
    
    res.json({ 
      message: 'Autenticación de dos factores deshabilitada exitosamente.',
      enabled: false
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ message: 'Error al deshabilitar la autenticación de dos factores.' });
  }
};

exports.getTwoFactorStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.getUserSecurityInfo(userId);
    
    res.json({
      enabled: user.two_factor_enabled,
      hasSecret: !!user.two_factor_secret
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ message: 'Error al obtener el estado de 2FA.' });
  }
};

// Controlador para gestión de cuentas suspendidas (solo admin senior)
exports.suspendUser = async (req, res) => {
  try {
    const { userId, reason, durationHours } = req.body;
    
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden suspender cuentas.' 
      });
    }
    
    if (!userId || !reason) {
      return res.status(400).json({ message: 'ID de usuario y razón requeridos.' });
    }
    
    // Verificar que el usuario existe
    const userToSuspend = await userModel.getUserById(userId);
    if (!userToSuspend) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Verificar que no se esté suspendiendo a sí mismo
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'No puedes suspender tu propia cuenta.' });
    }
    
    // Verificar que no se esté suspendiendo a otro admin senior
    if (userToSuspend.role === 'senior_admin') {
      return res.status(400).json({ message: 'No se pueden suspender cuentas de administradores senior.' });
    }
    
    // Suspender cuenta (14 días por defecto = 336 horas)
    const success = await securityModel.suspendAccount(
      userId, 
      reason, 
      req.user.id, 
      durationHours || 336
    );
    
    if (!success) {
      return res.status(500).json({ message: 'Error al suspender la cuenta.' });
    }
    
    // Enviar email de notificación
    try {
      await emailService.sendAccountSuspensionEmail(
        userToSuspend.email, 
        userToSuspend.username, 
        reason, 
        durationHours || 336,
        process.env.SENIOR_ADMIN_EMAIL
      );
    } catch (emailError) {
      console.error('Error sending suspension email:', emailError);
    }
    
    res.json({ 
      message: 'Cuenta suspendida exitosamente.',
      suspended: true
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden levantar suspensiones.' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario requerido.' });
    }
    
    // Verificar que el usuario existe
    const userToUnsuspend = await userModel.getUserById(userId);
    if (!userToUnsuspend) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Levantar suspensión
    const success = await securityModel.unsuspendAccount(userId);
    
    if (!success) {
      return res.status(500).json({ message: 'Error al levantar la suspensión.' });
    }
    
    // Enviar email de notificación
    try {
      await emailService.sendAccountUnsuspensionEmail(
        userToUnsuspend.email, 
        userToUnsuspend.username
      );
    } catch (emailError) {
      console.error('Error sending unsuspension email:', emailError);
    }
    
    res.json({ 
      message: 'Suspensión levantada exitosamente.',
      unsuspended: true
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Controlador para gestión de IPs bloqueadas
exports.blockIP = async (req, res) => {
  try {
    const { ipAddress, reason, durationHours } = req.body;
    
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden bloquear IPs.' 
      });
    }
    
    if (!ipAddress || !reason) {
      return res.status(400).json({ message: 'Dirección IP y razón requeridas.' });
    }
    
    // Calcular fecha de expiración
    let blockedUntil = null;
    if (durationHours) {
      blockedUntil = new Date();
      blockedUntil.setHours(blockedUntil.getHours() + durationHours);
    }
    
    // Bloquear IP
    const success = await securityModel.blockIP(ipAddress, reason, req.user.id, blockedUntil);
    
    if (!success) {
      return res.status(500).json({ message: 'Error al bloquear la IP.' });
    }
    
    res.json({ 
      message: 'IP bloqueada exitosamente.',
      blocked: true,
      ipAddress,
      reason,
      blockedUntil
    });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.unblockIP = async (req, res) => {
  try {
    const { ipAddress } = req.body;
    
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden desbloquear IPs.' 
      });
    }
    
    if (!ipAddress) {
      return res.status(400).json({ message: 'Dirección IP requerida.' });
    }
    
    // Desbloquear IP
    const success = await securityModel.unblockIP(ipAddress);
    
    if (!success) {
      return res.status(500).json({ message: 'Error al desbloquear la IP.' });
    }
    
    res.json({ 
      message: 'IP desbloqueada exitosamente.',
      unblocked: true,
      ipAddress
    });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getBlockedIPs = async (req, res) => {
  try {
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden ver IPs bloqueadas.' 
      });
    }
    
    const db = require('../models/database');
    const result = await db.query(`
      SELECT ip_address, reason, blocked_by, blocked_until, created_at
      FROM blocked_ips 
      ORDER BY created_at DESC
    `);
    
    const blockedIPs = result.rows || result;
    
    res.json({ blockedIPs });
  } catch (error) {
    console.error('Error getting blocked IPs:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Controlador para análisis de seguridad
exports.getSecurityAnalytics = async (req, res) => {
  try {
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden ver análisis de seguridad.' 
      });
    }
    
    const { days = 7 } = req.query;
    const analytics = await securityModel.getSecurityAnalytics(parseInt(days));
    
    res.json({ analytics });
  } catch (error) {
    console.error('Error getting security analytics:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getSuspiciousActivity = async (req, res) => {
  try {
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden ver actividad sospechosa.' 
      });
    }
    
    const { hours = 24 } = req.query;
    const suspiciousActivity = await securityModel.getSuspiciousActivity(parseInt(hours));
    
    res.json({ suspiciousActivity });
  } catch (error) {
    console.error('Error getting suspicious activity:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Controlador para obtener usuarios con información de seguridad
exports.getUsersWithSecurityInfo = async (req, res) => {
  try {
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden ver esta información.' 
      });
    }
    
    const users = await userModel.getAllUsersWithSecurityInfo();
    
    res.json({ users });
  } catch (error) {
    console.error('Error getting users with security info:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Controlador para obtener información de seguridad de un usuario específico
exports.getUserSecurityInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar que el usuario sea admin senior o el propio usuario
    if (req.user.role !== 'senior_admin' && parseInt(userId) !== req.user.id) {
      return res.status(403).json({ 
        message: 'Acceso denegado.' 
      });
    }
    
    const userInfo = await userModel.getUserSecurityInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    res.json({ userInfo });
  } catch (error) {
    console.error('Error getting user security info:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Controlador para limpiar datos antiguos
exports.cleanupOldData = async (req, res) => {
  try {
    // Verificar que el usuario sea admin senior
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Solo administradores senior pueden ejecutar limpieza.' 
      });
    }
    
    const success = await securityModel.cleanupOldData();
    
    if (!success) {
      return res.status(500).json({ message: 'Error al limpiar datos antiguos.' });
    }
    
    res.json({ 
      message: 'Limpieza de datos completada exitosamente.',
      cleaned: true
    });
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}; 

// Banear usuario (solo admin senior)
exports.banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores senior pueden banear usuarios.' });
    }
    if (!userId || !reason) {
      return res.status(400).json({ message: 'ID de usuario y razón requeridos.' });
    }
    const userToBan = await userModel.getUserById(userId);
    if (!userToBan) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'No puedes banear tu propia cuenta.' });
    }
    if (userToBan.role === 'senior_admin') {
      return res.status(400).json({ message: 'No se pueden banear cuentas de administradores senior.' });
    }
    // Banear usuario
    const success = await userModel.banUser(userId, reason);
    if (!success) {
      return res.status(500).json({ message: 'Error al banear la cuenta.' });
    }
    // Enviar email de notificación
    try {
      await emailService.sendAccountBanEmail(userToBan.email, userToBan.username, reason, process.env.SENIOR_ADMIN_EMAIL);
    } catch (emailError) {
      console.error('Error sending ban email:', emailError);
    }
    res.json({ message: 'Cuenta baneada permanentemente.', banned: true });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Desbanear usuario (solo admin senior)
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (req.user.role !== 'senior_admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores senior pueden desbanear usuarios.' });
    }
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario requerido.' });
    }
    const userToUnban = await userModel.getUserById(userId);
    if (!userToUnban) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    const success = await userModel.unbanUser(userId);
    if (!success) {
      return res.status(500).json({ message: 'Error al desbanear la cuenta.' });
    }
    // Enviar email de notificación
    try {
      await emailService.sendAccountUnbanEmail(userToUnban.email, userToUnban.username, process.env.SENIOR_ADMIN_EMAIL);
    } catch (emailError) {
      console.error('Error sending unban email:', emailError);
    }
    res.json({ message: 'Cuenta desbaneada exitosamente.', unbanned: true });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}; 