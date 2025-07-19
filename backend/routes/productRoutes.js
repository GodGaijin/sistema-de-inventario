const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, productController.getAllProducts);
router.get('/:id', authenticateToken, productController.getProductById);
router.post('/', authenticateToken, authorizeRole(['admin', 'senior_admin']), productController.createProduct);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'senior_admin']), productController.updateProduct);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'senior_admin']), productController.deleteProduct);

module.exports = router; 