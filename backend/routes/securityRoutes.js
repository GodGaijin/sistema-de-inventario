const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas para 2FA (requieren autenticación)
router.get('/2fa/status', authMiddleware.authenticateToken, securityController.getTwoFactorStatus);
router.post('/2fa/setup', authMiddleware.authenticateToken, securityController.setupTwoFactor);
router.post('/2fa/verify-setup', authMiddleware.authenticateToken, securityController.verifyTwoFactorSetup);
router.post('/2fa/disable', authMiddleware.authenticateToken, securityController.disableTwoFactor);

// Rutas para gestión de cuentas suspendidas (solo admin senior)
router.post('/users/suspend', authMiddleware.authenticateToken, securityController.suspendUser);
router.post('/users/unsuspend', authMiddleware.authenticateToken, securityController.unsuspendUser);
router.post('/users/ban', authMiddleware.authenticateToken, securityController.banUser);
router.post('/users/unban', authMiddleware.authenticateToken, securityController.unbanUser);

// Rutas para gestión de IPs bloqueadas (solo admin senior)
router.post('/ips/block', authMiddleware.authenticateToken, securityController.blockIP);
router.post('/ips/unblock', authMiddleware.authenticateToken, securityController.unblockIP);
router.get('/ips/blocked', authMiddleware.authenticateToken, securityController.getBlockedIPs);

// Rutas para análisis de seguridad (solo admin senior)
router.get('/analytics', authMiddleware.authenticateToken, securityController.getSecurityAnalytics);
router.get('/suspicious-activity', authMiddleware.authenticateToken, securityController.getSuspiciousActivity);

// Rutas para información de usuarios con seguridad (solo admin senior)
router.get('/users/security-info', authMiddleware.authenticateToken, securityController.getUsersWithSecurityInfo);
router.get('/users/:userId/security-info', authMiddleware.authenticateToken, securityController.getUserSecurityInfo);

// Ruta para limpieza de datos (solo admin senior)
router.post('/cleanup', authMiddleware.authenticateToken, securityController.cleanupOldData);

module.exports = router; 