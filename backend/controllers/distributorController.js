const distributorModel = require('../models/distributorModel');
const auditModel = require('../models/auditModel');

exports.getAllDistributors = (req, res) => {
  distributorModel.getAllDistributors((err, distributors) => {
    if (err) return res.status(500).json({ message: 'Error al obtener distribuidores' });
    res.json(distributors);
  });
};

exports.getDistributorById = (req, res) => {
  distributorModel.getDistributorById(req.params.id, (err, distributor) => {
    if (err) return res.status(500).json({ message: 'Error al obtener el distribuidor' });
    if (!distributor) return res.status(404).json({ message: 'Distribuidor no encontrado' });
    res.json(distributor);
  });
};

exports.createDistributor = (req, res) => {
  distributorModel.createDistributor(req.body, (err, id) => {
    if (err) return res.status(500).json({ message: 'Error al crear distribuidor' });
    auditModel.logAudit(req.user.id, req.user.username, 'crear', 'distribuidor', id);
    res.status(201).json({ id });
  });
};

exports.updateDistributor = (req, res) => {
  distributorModel.updateDistributor(req.params.id, req.body, (err, changes) => {
    if (err) return res.status(500).json({ message: 'Error al actualizar distribuidor' });
    if (!changes) return res.status(404).json({ message: 'Distribuidor no encontrado' });
    auditModel.logAudit(req.user.id, req.user.username, 'editar', 'distribuidor', req.params.id);
    res.json({ message: 'Distribuidor actualizado' });
  });
};

exports.deleteDistributor = (req, res) => {
  distributorModel.deleteDistributor(req.params.id, (err, changes) => {
    if (err) {
      if (err.message && err.message.includes('asignado a uno o más productos')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Error al eliminar distribuidor' });
    }
    if (!changes) return res.status(404).json({ message: 'Distribuidor no encontrado' });
    auditModel.logAudit(req.user.id, req.user.username, 'eliminar', 'distribuidor', req.params.id);
    res.json({ message: 'Distribuidor eliminado' });
  });
}; 