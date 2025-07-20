const db = require('./database');

const createAudit = async (audit) => {
  try {
    const { user_id, username, action, entity, entity_id } = audit;
    const result = await db.run(
      'INSERT INTO audits (user_id, username, action, entity, entity_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user_id, username, action, entity, entity_id]
    );
    return result.lastID || (result.rows && result.rows[0] ? result.rows[0].id : null);
  } catch (error) {
    throw error;
  }
};

const getAllAudits = async () => {
  try {
    console.log('📋 Obteniendo auditorías...');
    
    const result = await db.query(`
      SELECT 
        id, 
        user_id, 
        username, 
        action, 
        entity, 
        entity_id, 
        timestamp,
        CASE 
          WHEN timestamp IS NOT NULL THEN timestamp::text
          ELSE NOW()::text
        END as formatted_timestamp
      FROM audits 
      ORDER BY timestamp DESC NULLS LAST
    `);
    
    const audits = result.rows || result;
    console.log(`✅ ${audits.length} auditorías obtenidas`);
    
    return audits;
  } catch (error) {
    console.error('❌ Error obteniendo auditorías:', error);
    throw error;
  }
};

const logAudit = async (user_id, username, action, entity, entity_id) => {
  try {
    console.log('📝 Registrando auditoría:', { user_id, username, action, entity, entity_id });
    
    const result = await db.run(
      'INSERT INTO audits (user_id, username, action, entity, entity_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, timestamp',
      [user_id, username, action, entity, entity_id]
    );
    
    const auditId = result.lastID || (result.rows && result.rows[0] ? result.rows[0].id : null);
    const timestamp = result.rows && result.rows[0] ? result.rows[0].timestamp : new Date();
    
    console.log('✅ Auditoría registrada:', { auditId, timestamp });
    return auditId;
  } catch (error) {
    console.error('❌ Error registrando auditoría:', error);
    throw error;
  }
};

module.exports = {
  createAudit,
  getAllAudits,
  logAudit,
}; 