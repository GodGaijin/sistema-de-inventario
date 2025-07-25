const auditModel = require('../models/auditModel');

exports.getAllAudits = async (req, res) => {
  try {
    const audits = await auditModel.getAllAudits();
    
    // Formatear fechas para el frontend
    const formattedAudits = audits.map(audit => ({
      ...audit,
      timestamp: audit.timestamp ? new Date(audit.timestamp).toISOString() : new Date().toISOString(),
      formatted_timestamp: audit.formatted_timestamp || new Date().toISOString()
    }));
    
    res.json(formattedAudits);
  } catch (error) {
    console.error('❌ Error getting audits:', error);
    res.status(500).json({ 
      message: 'Error al obtener auditorías',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 