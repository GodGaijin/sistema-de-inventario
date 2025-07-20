const distributorModel = require('../models/distributorModel');
const auditModel = require('../models/auditModel');

exports.getAllDistributors = async (req, res) => {
  try {
    const distributors = await distributorModel.getAllDistributors();
    res.json(distributors);
  } catch (error) {
    console.error('Error getting distributors:', error);
    res.status(500).json({ message: 'Error al obtener distribuidores' });
  }
};

exports.getDistributorById = async (req, res) => {
  try {
    const distributor = await distributorModel.getDistributorById(req.params.id);
    if (!distributor) return res.status(404).json({ message: 'Distribuidor no encontrado' });
    res.json(distributor);
  } catch (error) {
    console.error('Error getting distributor:', error);
    res.status(500).json({ message: 'Error al obtener el distribuidor' });
  }
};

exports.createDistributor = async (req, res) => {
  try {
    console.log('Creating distributor with data:', req.body);
    
    // Validar datos de entrada
    const { name, contact, phone, email, rif, location } = req.body;
    if (!name || !contact || !phone || !email || !rif || !location) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    const id = await distributorModel.createDistributor(req.body);
    console.log('Distributor created with ID:', id);
    
    if (req.user && req.user.id) {
      try {
        await auditModel.logAudit(req.user.id, req.user.username, 'crear', 'distribuidor', id);
      } catch (auditError) {
        console.error('Error logging audit:', auditError);
        // No fallar la operación principal por un error de auditoría
      }
    }
    
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating distributor:', error);
    
    // Manejar errores específicos de la base de datos
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Ya existe un distribuidor con ese RIF o email' });
    }
    
    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ message: 'Datos incompletos para crear el distribuidor' });
    }
    
    res.status(500).json({ 
      message: 'Error al crear distribuidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateDistributor = async (req, res) => {
  try {
    const changes = await distributorModel.updateDistributor(req.params.id, req.body);
    if (!changes) return res.status(404).json({ message: 'Distribuidor no encontrado' });
    await auditModel.logAudit(req.user.id, req.user.username, 'editar', 'distribuidor', req.params.id);
    res.json({ message: 'Distribuidor actualizado' });
  } catch (error) {
    console.error('Error updating distributor:', error);
    res.status(500).json({ message: 'Error al actualizar distribuidor' });
  }
};

exports.deleteDistributor = async (req, res) => {
  try {
    const changes = await distributorModel.deleteDistributor(req.params.id);
    if (!changes) return res.status(404).json({ message: 'Distribuidor no encontrado' });
    await auditModel.logAudit(req.user.id, req.user.username, 'eliminar', 'distribuidor', req.params.id);
    res.json({ message: 'Distribuidor eliminado' });
  } catch (error) {
    console.error('Error deleting distributor:', error);
    if (error.message && error.message.includes('asignado a uno o más productos')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al eliminar distribuidor' });
  }
}; 