const db = require('./database');

const getOwnCommerce = async () => {
  try {
    const result = await db.query('SELECT * FROM own_commerce LIMIT 1');
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const upsertOwnCommerce = async (commerce) => {
  try {
    const { name, rif, location, description } = commerce;
    
    // Check if commerce data exists
    const existing = await getOwnCommerce();
    
    if (existing) {
      // Update existing
      const result = await db.run(
        'UPDATE own_commerce SET name = $1, rif = $2, location = $3, description = $4 WHERE id = $5',
        [name, rif, location, description, existing.id]
      );
      return result.changes;
    } else {
      // Create new
      const result = await db.run(
        'INSERT INTO own_commerce (name, rif, location, description) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, rif, location, description]
      );
      return result.lastID || (result.rows && result.rows[0] ? result.rows[0].id : null);
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getOwnCommerce,
  upsertOwnCommerce,
}; 