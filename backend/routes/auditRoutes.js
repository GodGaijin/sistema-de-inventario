const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, authorizeRole(['admin', 'senior_admin']), auditController.getAllAudits);

module.exports = router; 