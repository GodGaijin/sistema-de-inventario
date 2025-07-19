const express = require('express');
const router = express.Router();
const ownCommerceController = require('../controllers/ownCommerceController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, ownCommerceController.getOwnCommerce);
router.put('/', authenticateToken, authorizeRole(['admin', 'senior_admin']), ownCommerceController.upsertOwnCommerce);

module.exports = router; 