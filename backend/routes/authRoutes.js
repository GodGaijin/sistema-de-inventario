const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/check-session', authController.checkSession);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rutas protegidas para admin senior
router.get('/users', authenticateToken, authController.getAllUsers);
router.put('/users/:userId/role', authenticateToken, authController.updateUserRole);
router.delete('/users/:userId', authenticateToken, authController.deleteUser);

// Rutas para usuarios activos
router.get('/active-users-stats', authenticateToken, authController.getActiveUsersStats);
router.get('/active-users-with-roles', authenticateToken, authController.getActiveUsersWithRoles);

module.exports = router; 