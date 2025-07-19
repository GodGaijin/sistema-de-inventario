const express = require('express');
const router = express.Router();
const distributorController = require('../controllers/distributorController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, distributorController.getAllDistributors);
router.get('/:id', authenticateToken, distributorController.getDistributorById);
router.post('/', authenticateToken, authorizeRole(['admin', 'senior_admin']), distributorController.createDistributor);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'senior_admin']), distributorController.updateDistributor);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'senior_admin']), distributorController.deleteDistributor);

module.exports = router; 