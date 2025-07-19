const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rutas protegidas para admin senior
router.get('/users', authenticateToken, authController.getAllUsers);
router.put('/users/:userId/role', authenticateToken, authController.updateUserRole);

module.exports = router; 