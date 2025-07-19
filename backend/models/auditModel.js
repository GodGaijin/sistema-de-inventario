const db = require('./database');

const createAudit = async (audit) => {
  try {
    const { user_id, username, action, entity, entity_id } = audit;
    const result = await db.run(
      'INSERT INTO audits (user_id, username, action, entity, entity_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user_id, username, action, entity, entity_id]
    );
    return result.lastID || result.rows[0].id;
  } catch (error) {
    throw error;
  }
};

const getAllAudits = async () => {
  try {
    const result = await db.query('SELECT * FROM audits ORDER BY timestamp DESC');
    return result.rows || result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createAudit,
  getAllAudits,
}; 