const ownCommerceModel = require('../models/ownCommerceModel');
const auditModel = require('../models/auditModel');

exports.getOwnCommerce = (req, res) => {
  ownCommerceModel.getOwnCommerce((err, row) => {
    if (err) return res.status(500).json({ message: 'Error al obtener los datos del comercio' });
    res.json(row || {});
  });
};

exports.upsertOwnCommerce = (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'senior_admin') {
    return res.status(403).json({ message: 'Solo administradores pueden editar los datos del comercio' });
  }
  const { name, rif, location, description } = req.body;
  if (!name || !rif || !location) {
    return res.status(400).json({ message: 'Nombre, RIF y Ubicación son obligatorios' });
  }
  ownCommerceModel.upsertOwnCommerce({ name, rif, location, description }, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al guardar los datos del comercio' });
    // Registrar auditoría de actualización de datos del comercio
    auditModel.logAudit(req.user.id, req.user.username, 'editar', 'datos del comercio', 1);
    res.json({ success: true });
  });
}; 