const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/authMiddleware');

// Rutas para solicitudes de inventario (todos los usuarios)
router.post('/requests', authenticateToken, InventoryController.createRequest);
router.get('/requests/user', authenticateToken, InventoryController.getUserRequests);

// Rutas para transacciones (todos los usuarios)
router.get('/transactions', authenticateToken, InventoryController.getAllTransactions);
router.get('/transactions/user', authenticateToken, InventoryController.getUserTransactions);
router.get('/stats', authenticateToken, InventoryController.getInventoryStats);
router.get('/export', authenticateToken, InventoryController.exportTransactions);

// Rutas solo para administradores
router.get('/requests/pending', authenticateToken, isAdmin, InventoryController.getPendingRequests);
router.put('/requests/:requestId/approve', authenticateToken, isAdmin, InventoryController.approveRequest);
router.put('/requests/:requestId/reject', authenticateToken, isAdmin, InventoryController.rejectRequest);
router.get('/requests/history', authenticateToken, isAdmin, InventoryController.getRequestHistory);

module.exports = router; 