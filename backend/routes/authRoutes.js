const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const securityMiddleware = require('../middlewares/securityMiddleware');

// Rutas con middlewares de seguridad específicos
router.post('/register', 
  securityMiddleware.registrationLimiter,
  securityMiddleware.checkRegistrationLimits,
  securityMiddleware.verifyTurnstile,
  authController.register
);

router.post('/login', 
  securityMiddleware.loginLimiter,
  securityMiddleware.loginSlowDown,
  securityMiddleware.checkAccountSuspension,
  securityMiddleware.checkFailedLoginAttempts,
  securityMiddleware.verifyTurnstile,
  authController.login
);
router.post('/refresh', authController.refreshToken);
router.post('/check-session', authController.checkSession);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rutas para verificación de email
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
router.get('/check-resend-status/:email', authController.checkResendVerificationStatus);

// Rutas protegidas para admin senior
router.get('/users', authenticateToken, authController.getAllUsers);
router.put('/users/:userId/role', authenticateToken, authController.updateUserRole);
router.delete('/users/:userId', authenticateToken, authController.deleteUser);

// Rutas para usuarios activos
router.get('/active-users-stats', authenticateToken, authController.getActiveUsersStats);
router.get('/active-users-with-roles', authenticateToken, authController.getActiveUsersWithRoles);

module.exports = router; 