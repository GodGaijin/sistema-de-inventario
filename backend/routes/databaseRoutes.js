const express = require('express');
const router = express.Router();
const { 
  saveBackup, 
  getBackups, 
  restoreBackup, 
  deleteBackup 
} = require('../controllers/databaseController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Middleware para verificar que sea admin senior
const requireSeniorAdmin = (req, res, next) => {
  if (req.user.role !== 'senior_admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de Administrador Senior.'
    });
  }
  next();
};

// Todas las rutas requieren autenticación y rol de admin senior
router.use(authenticateToken);
router.use(requireSeniorAdmin);

// Guardar backup de la base de datos
router.post('/backup', saveBackup);

// Obtener lista de backups disponibles
router.get('/backups', getBackups);

// Restaurar base de datos desde backup
router.post('/restore', restoreBackup);



// Eliminar backup específico
router.delete('/backup/:backupName', deleteBackup);

module.exports = router; 