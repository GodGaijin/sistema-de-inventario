const ownCommerceModel = require('../models/ownCommerceModel');
const auditModel = require('../models/auditModel');

exports.getOwnCommerce = async (req, res) => {
  try {
    const row = await ownCommerceModel.getOwnCommerce();
    res.json(row || {});
  } catch (error) {
    console.error('Error getting commerce data:', error);
    res.status(500).json({ message: 'Error al obtener los datos del comercio' });
  }
};

exports.upsertOwnCommerce = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'senior_admin') {
      return res.status(403).json({ message: 'Solo administradores pueden editar los datos del comercio' });
    }
    const { name, rif, location, description } = req.body;
    if (!name || !rif || !location) {
      return res.status(400).json({ message: 'Nombre, RIF y Ubicación son obligatorios' });
    }
    
    const result = await ownCommerceModel.upsertOwnCommerce({ name, rif, location, description });
    
    // Registrar auditoría de actualización de datos del comercio
    await auditModel.logAudit(req.user.id, req.user.username, 'editar', 'datos del comercio', 1);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving commerce data:', error);
    res.status(500).json({ message: 'Error al guardar los datos del comercio' });
  }
}; 