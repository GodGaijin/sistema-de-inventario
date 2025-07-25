const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const securityModel = require('../models/securityModel');
const https = require('https');

// Función para hacer requests HTTPS sin depender de fetch
const makeHttpsRequest = (url, options) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = options.body;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            json: () => Promise.resolve(jsonData),
            ok: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

// Configuración de Turnstile
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
    blocked: true
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Registrar el bloqueo
    securityModel.logSecurityEvent(req, 'login_blocked', {
      username: req.body.username,
      reason: 'rate_limit_exceeded'
    });
    res.status(429).json({
      message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
      blocked: true
    });
  }
});

// Rate limiting para registro
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 intentos
  message: {
    message: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.',
    blocked: true
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Registrar el bloqueo
    securityModel.logSecurityEvent(req, 'registration_blocked', {
      email: req.body.email,
      username: req.body.username,
      reason: 'rate_limit_exceeded'
    });
    res.status(429).json({
      message: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.',
      blocked: true
    });
  }
});

// Slow down para intentos fallidos
const loginSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 2, // después de 2 intentos
  delayMs: () => 1000, // 1 segundo de delay por intento adicional
  maxDelayMs: 10000 // máximo 10 segundos de delay
});

// Middleware para verificar Cloudflare Turnstile
const verifyTurnstile = async (req, res, next) => {
  try {
    const token = req.body.turnstileToken;
    
    if (!token) {
      await securityModel.logSecurityEvent(req, 'turnstile_missing', {
        action: req.path,
        username: req.body?.username || req.body?.email
      });
      return res.status(400).json({
        message: 'Verificación Turnstile requerida.',
        turnstileRequired: true
      });
    }
    if (!TURNSTILE_SECRET_KEY) {
      return next();
    }

    const ip = securityModel.getClientIP(req);
    
    const response = await makeHttpsRequest('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip
      }).toString()
    });
    const data = await response.json();
    
    if (!data.success) {
      await securityModel.logSecurityEvent(req, 'turnstile_failed', {
        action: req.path,
        username: req.body.username || req.body.email,
        errorCodes: data['error-codes']
      });
      return res.status(400).json({
        message: 'Verificación Turnstile fallida.',
        turnstileFailed: true,
        errorCodes: data['error-codes']
      });
    }
    // Puedes usar data.score si quieres lógica adicional
    req.turnstileData = data;
    next();
  } catch (error) {
    console.error('❌ Error verificando Turnstile:', error);
    await securityModel.logSecurityEvent(req, 'turnstile_error', {
      action: req.path,
      error: error.message
    });
    return res.status(500).json({
      message: 'Error en la verificación de seguridad.'
    });
  }
};

// Middleware para verificar IP bloqueada
const checkBlockedIP = async (req, res, next) => {
  try {
    const ip = securityModel.getClientIP(req);
    const blockedIP = await securityModel.isIPBlocked(ip);
    
    if (blockedIP) {
      await securityModel.logSecurityEvent(req, 'blocked_ip_access', {
        action: req.path,
        reason: blockedIP.reason
      });
      
      return res.status(403).json({
        message: 'Tu IP ha sido bloqueada por actividad sospechosa.',
        blocked: true,
        reason: blockedIP.reason
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking blocked IP:', error);
    next();
  }
};

// Middleware para análisis de comportamiento
const behaviorAnalysis = async (req, res, next) => {
  try {
    const ip = securityModel.getClientIP(req);
    const userAgent = req.get('User-Agent') || '';
    const userAgentAnalysis = securityModel.analyzeUserAgent(userAgent);
    
    // Detectar comportamientos sospechosos
    const suspiciousBehaviors = [];
    
    // Verificar si es un bot
    if (userAgentAnalysis.isBot) {
      suspiciousBehaviors.push('bot_detected');
    }
    
    // Verificar User-Agent sospechoso
    if (userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('python')) {
      suspiciousBehaviors.push('suspicious_user_agent');
    }
    
    // Verificar si no tiene User-Agent
    if (!userAgent || userAgent.length < 10) {
      suspiciousBehaviors.push('missing_user_agent');
    }
    
    // Verificar IP privada/local (puede ser sospechoso en producción)
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') || ip === '127.0.0.1') {
      suspiciousBehaviors.push('private_ip');
    }
    
    // Agregar información al request
    req.securityAnalysis = {
      ip,
      userAgentAnalysis,
      suspiciousBehaviors,
      riskLevel: suspiciousBehaviors.length > 0 ? 'high' : 'low'
    };
    
    next();
  } catch (error) {
    console.error('Error in behavior analysis:', error);
    next();
  }
};

// Middleware para verificar límites de registro por IP
const checkRegistrationLimits = async (req, res, next) => {
  try {
    const ip = securityModel.getClientIP(req);
    const limits = await securityModel.checkRegistrationLimits(ip);
    
    if (!limits.allowed) {
      await securityModel.logSecurityEvent(req, 'registration_limit_exceeded', {
        email: req.body.email,
        username: req.body.username,
        totalAttempts: limits.totalAttempts,
        successfulAttempts: limits.successfulAttempts
      });
      
      return res.status(429).json({
        message: 'Demasiados intentos de registro desde esta IP.',
        blocked: true,
        totalAttempts: limits.totalAttempts,
        successfulAttempts: limits.successfulAttempts
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking registration limits:', error);
    next();
  }
};

// Middleware para verificar suspensión de cuenta
const checkAccountSuspension = async (req, res, next) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return next();
    }
    
    // Buscar usuario
    const userModel = require('../models/userModel');
    const user = await userModel.findUserByUsername(username);
    
    if (!user) {
      return next();
    }
    
    const suspension = await securityModel.isAccountSuspended(user.id);
    
    if (suspension) {
      await securityModel.logSecurityEvent(req, 'suspended_account_login_attempt', {
        username,
        reason: suspension.reason
      });
      
      return res.status(403).json({
        message: 'Tu cuenta ha sido suspendida temporalmente.',
        suspended: true,
        reason: suspension.reason,
        expires: suspension.expires
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking account suspension:', error);
    next();
  }
};

// Middleware para verificar intentos fallidos de login
const checkFailedLoginAttempts = async (req, res, next) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return next();
    }
    
    const userModel = require('../models/userModel');
    const user = await userModel.findUserByUsername(username);
    
    if (!user) {
      return next();
    }
    
    // Verificar si la cuenta está bloqueada por intentos fallidos
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      await securityModel.logSecurityEvent(req, 'account_locked_login_attempt', {
        username,
        lockedUntil: user.account_locked_until
      });
      
      return res.status(423).json({
        message: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos.',
        locked: true,
        lockedUntil: user.account_locked_until
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking failed login attempts:', error);
    next();
  }
};

// Middleware para logging de seguridad
const securityLogging = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log después de que se complete la respuesta
    setTimeout(async () => {
      try {
        const action = req.path.replace('/', '');
        const details = {
          method: req.method,
          statusCode: res.statusCode,
          username: (req.body && (req.body.username || req.body.email)) || null,
          turnstileData: req.turnstileData || null,
          securityAnalysis: req.securityAnalysis || null
        };
        
        // Determinar el tipo de acción
        let logAction = action;
        if (action === 'login' && res.statusCode === 200) {
          logAction = 'login_success';
        } else if (action === 'login' && res.statusCode === 401) {
          logAction = 'login_failed';
        } else if (action === 'register' && res.statusCode === 201) {
          logAction = 'registration_success';
        } else if (action === 'register' && res.statusCode === 409) {
          logAction = 'registration_duplicate';
        }
        
        await securityModel.logSecurityEvent(req, logAction, details);
      } catch (error) {
        console.error('Error in security logging:', error);
      }
    }, 100);
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware para limpiar datos antiguos (ejecutar diariamente)
const cleanupMiddleware = async (req, res, next) => {
  // Solo ejecutar limpieza en 1 de cada 1000 requests para no afectar el rendimiento
  if (Math.random() < 0.001) {
    try {
      await securityModel.cleanupOldData();
    } catch (error) {
      console.error('Error in cleanup middleware:', error);
    }
  }
  next();
};

module.exports = {
  loginLimiter,
  registrationLimiter,
  loginSlowDown,
  verifyTurnstile,
  checkBlockedIP,
  behaviorAnalysis,
  checkRegistrationLimits,
  checkAccountSuspension,
  checkFailedLoginAttempts,
  securityLogging,
  cleanupMiddleware
}; 