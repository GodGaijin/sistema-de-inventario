const db = require('./database');
const geoip = require('geoip-lite');
const UserAgent = require('user-agents');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Función para obtener la IP real del cliente
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip;
};

// Función para analizar el User-Agent
const analyzeUserAgent = (userAgentString) => {
  try {
    const userAgent = new UserAgent(userAgentString);
    return {
      browser: userAgent.browser,
      os: userAgent.os,
      device: userAgent.device,
      isBot: userAgent.isBot,
      isMobile: userAgent.isMobile,
      isDesktop: userAgent.isDesktop
    };
  } catch (error) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
      isBot: false,
      isMobile: false,
      isDesktop: false
    };
  }
};

// Función para obtener información de geolocalización
const getLocationData = (ip) => {
  try {
    const geo = geoip.lookup(ip);
    return geo ? {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      timezone: geo.timezone,
      ll: geo.ll
    } : null;
  } catch (error) {
    return null;
  }
};

// Función para calcular el score de riesgo
const calculateRiskScore = (data) => {
  let score = 0.0;
  
  // Factores de riesgo
  if (data.isBot) score += 0.3;
  if (data.failedAttempts > 3) score += 0.2;
  if (data.suspiciousIP) score += 0.2;
  if (data.rapidRequests) score += 0.15;
  if (data.unusualLocation) score += 0.15;
  if (data.suspiciousUserAgent) score += 0.1;
  
  return Math.min(score, 1.0);
};

// Registrar evento de auditoría de seguridad
const logSecurityEvent = async (req, action, details = {}, userId = null) => {
  try {
    const ip = getClientIP(req);
    const userAgent = req.get('User-Agent') || '';
    const userAgentAnalysis = analyzeUserAgent(userAgent);
    const locationData = getLocationData(ip);
    
    // Calcular score de riesgo
    const riskScore = calculateRiskScore({
      isBot: userAgentAnalysis.isBot,
      failedAttempts: details.failedAttempts || 0,
      suspiciousIP: details.suspiciousIP || false,
      rapidRequests: details.rapidRequests || false,
      unusualLocation: details.unusualLocation || false,
      suspiciousUserAgent: details.suspiciousUserAgent || false
    });

    await db.run(`
      INSERT INTO security_audit_log 
      (user_id, username, ip_address, user_agent, action, details, risk_score, location_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      details.username || null,
      ip,
      userAgent,
      action,
      JSON.stringify(details),
      riskScore,
      locationData ? JSON.stringify(locationData) : null
    ]);

    return { ip, riskScore, locationData };
  } catch (error) {
    console.error('Error logging security event:', error);
    return null;
  }
};

// Verificar si una IP está bloqueada
const isIPBlocked = async (ip) => {
  try {
    const result = await db.query(`
      SELECT * FROM blocked_ips 
      WHERE ip_address = $1 
      AND (blocked_until IS NULL OR blocked_until > NOW())
    `, [ip]);
    
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    console.error('Error checking blocked IP:', error);
    return null;
  }
};

// Bloquear una IP
const blockIP = async (ip, reason, blockedBy = null, blockedUntil = null) => {
  try {
    await db.run(`
      INSERT INTO blocked_ips (ip_address, reason, blocked_by, blocked_until)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (ip_address) 
      DO UPDATE SET 
        reason = $2, 
        blocked_by = $3, 
        blocked_until = $4,
        created_at = CURRENT_TIMESTAMP
    `, [ip, reason, blockedBy, blockedUntil]);
    
    return true;
  } catch (error) {
    console.error('Error blocking IP:', error);
    return false;
  }
};

// Desbloquear una IP
const unblockIP = async (ip) => {
  try {
    await db.run('DELETE FROM blocked_ips WHERE ip_address = $1', [ip]);
    return true;
  } catch (error) {
    console.error('Error unblocking IP:', error);
    return false;
  }
};

// Registrar intento de registro
const logRegistrationAttempt = async (ip, email, username, success) => {
  try {
    await db.run(`
      INSERT INTO registration_attempts (ip_address, email, username, success)
      VALUES ($1, $2, $3, $4)
    `, [ip, email, username, success]);
    
    return true;
  } catch (error) {
    console.error('Error logging registration attempt:', error);
    return false;
  }
};

// Verificar límites de registro por IP
const checkRegistrationLimits = async (ip) => {
  try {
    // Contar intentos en las últimas 24 horas
    const result = await db.query(`
      SELECT COUNT(*) as count, 
             COUNT(CASE WHEN success = true THEN 1 END) as successful
      FROM registration_attempts 
      WHERE ip_address = $1 
      AND timestamp > NOW() - INTERVAL '24 hours'
    `, [ip]);
    
    const data = result.rows ? result.rows[0] : result[0];
    const totalAttempts = parseInt(data.count);
    const successfulAttempts = parseInt(data.successful);
    
    return {
      totalAttempts,
      successfulAttempts,
      allowed: totalAttempts < 5 && successfulAttempts < 2
    };
  } catch (error) {
    console.error('Error checking registration limits:', error);
    return { totalAttempts: 0, successfulAttempts: 0, allowed: true };
  }
};

// Funciones para 2FA
const generateTwoFactorSecret = async (userId) => {
  try {
    const secret = speakeasy.generateSecret({
      name: 'Sistema de Inventario',
      issuer: 'Tu Empresa',
      length: 20
    });
    
    // Generar códigos de respaldo
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(speakeasy.generateSecret({ length: 8 }).base32);
    }
    
    await db.run(`
      UPDATE users 
      SET two_factor_secret = $1, two_factor_backup_codes = $2
      WHERE id = $3
    `, [secret.base32, JSON.stringify(backupCodes), userId]);
    
    return {
      secret: secret.base32,
      qrCode: await qrcode.toDataURL(secret.otpauth_url),
      backupCodes
    };
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    throw error;
  }
};

const verifyTwoFactorCode = async (userId, code) => {
  try {
    const user = await db.query('SELECT two_factor_secret, two_factor_backup_codes FROM users WHERE id = $1', [userId]);
    const userData = user.rows ? user.rows[0] : user[0];
    
    if (!userData || !userData.two_factor_secret) {
      return false;
    }
    
    // Verificar código TOTP
    const isValid = speakeasy.totp.verify({
      secret: userData.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });
    
    if (isValid) {
      return true;
    }
    
    // Verificar códigos de respaldo
    if (userData.two_factor_backup_codes) {
      const backupCodes = JSON.parse(userData.two_factor_backup_codes);
      const backupIndex = backupCodes.indexOf(code);
      
      if (backupIndex !== -1) {
        // Remover código usado
        backupCodes.splice(backupIndex, 1);
        await db.run(`
          UPDATE users SET two_factor_backup_codes = $1 WHERE id = $2
        `, [JSON.stringify(backupCodes), userId]);
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return false;
  }
};

const enableTwoFactor = async (userId) => {
  try {
    await db.run('UPDATE users SET two_factor_enabled = TRUE WHERE id = $1', [userId]);
    return true;
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return false;
  }
};

const disableTwoFactor = async (userId) => {
  try {
    await db.run(`
      UPDATE users 
      SET two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_backup_codes = NULL 
      WHERE id = $1
    `, [userId]);
    return true;
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return false;
  }
};

// Funciones para gestión de cuentas suspendidas
const suspendAccount = async (userId, reason, suspendedBy, durationHours = 336) => { // 14 días = 336 horas
  try {
    const suspensionExpires = new Date();
    suspensionExpires.setHours(suspensionExpires.getHours() + durationHours);
    
    await db.run(`
      UPDATE users 
      SET account_suspended = TRUE, 
          suspension_reason = $1, 
          suspension_date = CURRENT_TIMESTAMP,
          suspension_expires = $2
      WHERE id = $3
    `, [reason, suspensionExpires.toISOString(), userId]);
    
    return true;
  } catch (error) {
    console.error('Error suspending account:', error);
    return false;
  }
};

const unsuspendAccount = async (userId) => {
  try {
    await db.run(`
      UPDATE users 
      SET account_suspended = FALSE, 
          suspension_reason = NULL, 
          suspension_date = NULL,
          suspension_expires = NULL
      WHERE id = $3
    `, [userId]);
    
    return true;
  } catch (error) {
    console.error('Error unsuspending account:', error);
    return false;
  }
};

const isAccountSuspended = async (userId) => {
  try {
    const result = await db.query(`
      SELECT account_suspended, suspension_reason, suspension_expires
      FROM users WHERE id = $1
    `, [userId]);
    
    const user = result.rows ? result.rows[0] : result[0];
    
    if (!user || !user.account_suspended) {
      return null;
    }
    
    // Verificar si la suspensión ha expirado
    if (user.suspension_expires && new Date(user.suspension_expires) < new Date()) {
      await unsuspendAccount(userId);
      return null;
    }
    
    return {
      suspended: true,
      reason: user.suspension_reason,
      expires: user.suspension_expires
    };
  } catch (error) {
    console.error('Error checking account suspension:', error);
    return null;
  }
};

// Función para verificar si una IP es conocida para un usuario
const isKnownIP = async (userId, ip) => {
  try {
    const result = await db.query(`
      SELECT 
        registration_ip,
        last_login_ip,
        COUNT(DISTINCT ip_address) as known_ips_count
      FROM users u
      LEFT JOIN security_audit_log sal ON u.id = sal.user_id 
        AND sal.action = 'login_success' 
        AND sal.timestamp > NOW() - INTERVAL '30 days'
      WHERE u.id = $1
      GROUP BY u.registration_ip, u.last_login_ip
    `, [userId]);
    
    const user = result.rows ? result.rows[0] : result[0];
    
    if (!user) return false;
    
    // IPs conocidas: IP de registro, última IP de login, y IPs de los últimos 30 días
    const knownIPs = new Set();
    if (user.registration_ip) knownIPs.add(user.registration_ip);
    if (user.last_login_ip) knownIPs.add(user.last_login_ip);
    
    // Obtener IPs de los últimos 30 días
    const recentIPs = await db.query(`
      SELECT DISTINCT ip_address 
      FROM security_audit_log 
      WHERE user_id = $1 
        AND action = 'login_success' 
        AND timestamp > NOW() - INTERVAL '30 days'
    `, [userId]);
    
    const recentIPsList = recentIPs.rows || recentIPs;
    recentIPsList.forEach(row => knownIPs.add(row.ip_address));
    
    return knownIPs.has(ip);
  } catch (error) {
    console.error('Error checking known IP:', error);
    return false;
  }
};

// Función para requerir 2FA en login desde IP no conocida
const require2FAForUnknownIP = async (userId, ip) => {
  try {
    const user = await db.query(`
      SELECT two_factor_enabled 
      FROM users WHERE id = $1
    `, [userId]);
    
    const userData = user.rows ? user.rows[0] : user[0];
    
    if (!userData || !userData.two_factor_enabled) {
      return false; // No requiere 2FA si no está habilitado
    }
    
    const isKnown = await isKnownIP(userId, ip);
    return !isKnown; // Requiere 2FA si la IP no es conocida
  } catch (error) {
    console.error('Error checking 2FA requirement:', error);
    return false;
  }
};

// Funciones para análisis de comportamiento
const getSecurityAnalytics = async (days = 7) => {
  try {
    const result = await db.query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_events,
        COUNT(CASE WHEN risk_score > 0.5 THEN 1 END) as high_risk_events,
        COUNT(CASE WHEN action = 'login_failed' THEN 1 END) as failed_logins,
        COUNT(CASE WHEN action = 'registration' THEN 1 END) as registrations,
        AVG(risk_score) as avg_risk_score
      FROM security_audit_log 
      WHERE timestamp > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);
    
    return result.rows || result;
  } catch (error) {
    console.error('Error getting security analytics:', error);
    return [];
  }
};

const getSuspiciousActivity = async (hours = 24) => {
  try {
    const result = await db.query(`
      SELECT 
        ip_address,
        COUNT(*) as event_count,
        AVG(risk_score) as avg_risk_score,
        MAX(risk_score) as max_risk_score,
        array_agg(DISTINCT action) as actions,
        MAX(timestamp) as last_activity
      FROM security_audit_log 
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
        AND risk_score > 0.3
      GROUP BY ip_address
      HAVING COUNT(*) > 5
      ORDER BY avg_risk_score DESC
    `);
    
    return result.rows || result;
  } catch (error) {
    console.error('Error getting suspicious activity:', error);
    return [];
  }
};

// Función para limpiar datos antiguos
const cleanupOldData = async () => {
  try {
    // Limpiar logs de seguridad de más de 90 días
    await db.run(`
      DELETE FROM security_audit_log 
      WHERE timestamp < NOW() - INTERVAL '90 days'
    `);
    
    // Limpiar intentos de registro de más de 30 días
    await db.run(`
      DELETE FROM registration_attempts 
      WHERE timestamp < NOW() - INTERVAL '30 days'
    `);
    
    // Limpiar códigos 2FA expirados
    await db.run(`
      DELETE FROM two_factor_codes 
      WHERE expires_at < NOW()
    `);
    
    // Limpiar IPs bloqueadas expiradas
    await db.run(`
      DELETE FROM blocked_ips 
      WHERE blocked_until IS NOT NULL AND blocked_until < NOW()
    `);
    
    return true;
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    return false;
  }
};

module.exports = {
  getClientIP,
  analyzeUserAgent,
  getLocationData,
  calculateRiskScore,
  logSecurityEvent,
  isIPBlocked,
  blockIP,
  unblockIP,
  logRegistrationAttempt,
  checkRegistrationLimits,
  generateTwoFactorSecret,
  verifyTwoFactorCode,
  enableTwoFactor,
  disableTwoFactor,
  suspendAccount,
  unsuspendAccount,
  isAccountSuspended,
  isKnownIP,
  require2FAForUnknownIP,
  getSecurityAnalytics,
  getSuspiciousActivity,
  cleanupOldData
}; 