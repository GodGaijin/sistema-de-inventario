const express = require('express');
const router = express.Router();
const {
    createRequest,
    getPendingRequests,
    getUserRequests,
    approveRequest,
    rejectRequest,
    getRequestHistory,
    getAllTransactions,
    getUserTransactions,
    getInventoryStats,
    exportTransactions
} = require('../controllers/inventoryController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/authMiddleware');

// Rutas para solicitudes de inventario (todos los usuarios)
router.post('/requests', authenticateToken, createRequest);
router.get('/requests/user', authenticateToken, getUserRequests);

// Rutas para transacciones (todos los usuarios)
router.get('/transactions', authenticateToken, getAllTransactions);
router.get('/transactions/user', authenticateToken, getUserTransactions);
router.get('/stats', authenticateToken, getInventoryStats);
router.get('/export', authenticateToken, exportTransactions);

// Rutas solo para administradores
router.get('/requests/pending', authenticateToken, isAdmin, getPendingRequests);
router.put('/requests/:requestId/approve', authenticateToken, isAdmin, approveRequest);
router.put('/requests/:requestId/reject', authenticateToken, isAdmin, rejectRequest);
router.get('/requests/history', authenticateToken, isAdmin, getRequestHistory);

module.exports = router; 