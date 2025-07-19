const auditModel = require('../models/auditModel');

exports.getAllAudits = (req, res) => {
  auditModel.getAllAudits((err, audits) => {
    if (err) return res.status(500).json({ message: 'Error al obtener auditorías' });
    res.json(audits);
  });
}; 