const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../db/inventory.db');
const backupsDir = path.resolve(__dirname, '../db/backups');

// Crear directorio de backups si no existe
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Guardar backup de la base de datos
const saveBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupName);

    // Crear copia de la base de datos
    fs.copyFileSync(dbPath, backupPath);

    // Registrar en auditoría
    const db = new sqlite3.Database(dbPath);
    db.run(`INSERT INTO audits (user_id, username, action, entity, entity_id, timestamp) VALUES (?, ?, ?, ?, ?, datetime('now'))`, 
      [req.user.id, req.user.username, 'backup', 'base de datos', null], function(err) {
      if (err) {
        console.log('Error al registrar auditoría de backup:', err.message);
      }
    });

    res.json({
      success: true,
      message: 'Backup guardado exitosamente',
      backupName: backupName,
      timestamp: timestamp
    });

    db.close();
  } catch (error) {
    console.error('Error al guardar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar backup de la base de datos'
    });
  }
};

// Obtener lista de backups disponibles
const getBackups = async (req, res) => {
  try {
    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json({
      success: true,
      backups: backups
    });
  } catch (error) {
    console.error('Error al obtener backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de backups'
    });
  }
};

// Restaurar base de datos desde backup
const restoreBackup = async (req, res) => {
  try {
    const { backupName } = req.body;

    if (!backupName) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del backup es requerido'
      });
    }

    const backupPath = path.join(backupsDir, backupName);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup no encontrado'
      });
    }

    // Verificar que el backup sea válido
    const testDb = new sqlite3.Database(backupPath);
    testDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      testDb.close();
      
      if (err || !row) {
        return res.status(400).json({
          success: false,
          message: 'El archivo de backup no es válido'
        });
      }

      // Crear backup del estado actual antes de restaurar
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const currentBackupName = `pre_restore_${timestamp}.db`;
      const currentBackupPath = path.join(backupsDir, currentBackupName);
      fs.copyFileSync(dbPath, currentBackupPath);

      // Restaurar el backup
      fs.copyFileSync(backupPath, dbPath);

      // Registrar en auditoría
      const db = new sqlite3.Database(dbPath);
      db.run(`INSERT INTO audits (user_id, username, action, entity, entity_id, timestamp) VALUES (?, ?, ?, ?, ?, datetime('now'))`, 
        [req.user.id, req.user.username, 'restaurar', 'base de datos', null], function(err) {
        if (err) {
          console.log('Error al registrar auditoría de restauración:', err.message);
        }
      });

      res.json({
        success: true,
        message: 'Base de datos restaurada exitosamente',
        restoredFrom: backupName,
        currentBackup: currentBackupName
      });

      db.close();
    });

  } catch (error) {
    console.error('Error al restaurar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar la base de datos'
    });
  }
};



// Eliminar backup
const deleteBackup = async (req, res) => {
  try {
    const { backupName } = req.params;

    if (!backupName) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del backup es requerido'
      });
    }

    const backupPath = path.join(backupsDir, backupName);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup no encontrado'
      });
    }

    // Eliminar archivo
    fs.unlinkSync(backupPath);

    // Registrar en auditoría
    const db = new sqlite3.Database(dbPath);
    db.run(`INSERT INTO audits (user_id, username, action, entity, entity_id, timestamp) VALUES (?, ?, ?, ?, ?, datetime('now'))`, 
      [req.user.id, req.user.username, 'eliminar backup', 'base de datos', null], function(err) {
      if (err) {
        console.log('Error al registrar auditoría de eliminación:', err.message);
      }
    });

    res.json({
      success: true,
      message: 'Backup eliminado exitosamente'
    });

    db.close();
  } catch (error) {
    console.error('Error al eliminar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el backup'
    });
  }
};

module.exports = {
  saveBackup,
  getBackups,
  restoreBackup,
  deleteBackup
}; 