const db = require('./database');

const getAllDistributors = async () => {
  try {
    const result = await db.query('SELECT * FROM distributors ORDER BY name');
    return result.rows || result;
  } catch (error) {
    throw error;
  }
};

const getDistributorById = async (id) => {
  try {
    const result = await db.query('SELECT * FROM distributors WHERE id = $1', [id]);
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const createDistributor = async (distributor) => {
  try {
    const { name, contact, phone, email, rif, location } = distributor;
    
    // Validar que todos los campos estén presentes
    if (!name || !contact || !phone || !email || !rif || !location) {
      throw new Error('Todos los campos son requeridos');
    }
    
    const result = await db.run(
      'INSERT INTO distributors (name, contact, phone, email, rif, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [name.trim(), contact.trim(), phone.trim(), email.trim(), rif.trim(), location.trim()]
    );
    
    // Extraer el ID del resultado
    let id;
    if (result.rows && result.rows.length > 0) {
      id = result.rows[0].id;
    } else if (result.lastID) {
      id = result.lastID;
    } else {
      throw new Error('No se pudo obtener el ID del distribuidor creado');
    }
    
    return id;
  } catch (error) {
    console.error('Error in createDistributor:', error);
    throw error;
  }
};

const updateDistributor = async (id, distributor) => {
  try {
    const { name, contact, phone, email, rif, location } = distributor;
    const result = await db.run(
      'UPDATE distributors SET name = $1, contact = $2, phone = $3, email = $4, rif = $5, location = $6 WHERE id = $7',
      [name, contact, phone, email, rif, location, id]
    );
    return result.changes;
  } catch (error) {
    throw error;
  }
};

const deleteDistributor = async (id) => {
  try {
    // Check if any product uses this distributor
    const checkResult = await db.query('SELECT COUNT(*) as count FROM products WHERE distributor_id = $1', [id]);
    const count = checkResult.rows ? checkResult.rows[0].count : checkResult[0].count;
    
    if (count > 0) {
      throw new Error('Cannot delete distributor: it is assigned to one or more products.');
    }
    
    // Safe to delete
    const result = await db.run('DELETE FROM distributors WHERE id = $1', [id]);
    return result.changes;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllDistributors,
  getDistributorById,
  createDistributor,
  updateDistributor,
  deleteDistributor,
}; 