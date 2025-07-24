const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas para 2FA (requieren autenticación)
router.get('/2fa/status', authMiddleware, securityController.getTwoFactorStatus);
router.post('/2fa/setup', authMiddleware, securityController.setupTwoFactor);
router.post('/2fa/verify-setup', authMiddleware, securityController.verifyTwoFactorSetup);
router.post('/2fa/disable', authMiddleware, securityController.disableTwoFactor);

// Rutas para gestión de cuentas suspendidas (solo admin senior)
router.post('/users/suspend', authMiddleware, securityController.suspendUser);
router.post('/users/unsuspend', authMiddleware, securityController.unsuspendUser);

// Rutas para gestión de IPs bloqueadas (solo admin senior)
router.post('/ips/block', authMiddleware, securityController.blockIP);
router.post('/ips/unblock', authMiddleware, securityController.unblockIP);
router.get('/ips/blocked', authMiddleware, securityController.getBlockedIPs);

// Rutas para análisis de seguridad (solo admin senior)
router.get('/analytics', authMiddleware, securityController.getSecurityAnalytics);
router.get('/suspicious-activity', authMiddleware, securityController.getSuspiciousActivity);

// Rutas para información de usuarios con seguridad (solo admin senior)
router.get('/users/security-info', authMiddleware, securityController.getUsersWithSecurityInfo);
router.get('/users/:userId/security-info', authMiddleware, securityController.getUserSecurityInfo);

// Ruta para limpieza de datos (solo admin senior)
router.post('/cleanup', authMiddleware, securityController.cleanupOldData);

module.exports = router; 