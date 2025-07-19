const db = require('./database');

const getAllProducts = async () => {
  try {
    const result = await db.query(`
      SELECT p.*, c.name as category_name, d.name as distributor_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN distributors d ON p.distributor_id = d.id 
      ORDER BY p.name
    `);
    return result.rows || result;
  } catch (error) {
    throw error;
  }
};

const getProductById = async (id) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.name as category_name, d.name as distributor_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN distributors d ON p.distributor_id = d.id 
      WHERE p.id = $1
    `, [id]);
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const createProduct = async (product) => {
  try {
    const { name, description, price, stock, category_id, distributor_id } = product;
    const result = await db.run(
      'INSERT INTO products (name, description, price, stock, category_id, distributor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [name, description, price, stock, category_id, distributor_id]
    );
    return result.lastID || result.rows[0].id;
  } catch (error) {
    throw error;
  }
};

const updateProduct = async (id, product) => {
  try {
    const { name, description, price, stock, category_id, distributor_id } = product;
    const result = await db.run(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, category_id = $5, distributor_id = $6 WHERE id = $7',
      [name, description, price, stock, category_id, distributor_id, id]
    );
    return result.changes;
  } catch (error) {
    throw error;
  }
};

const deleteProduct = async (id) => {
  try {
    const result = await db.run('DELETE FROM products WHERE id = $1', [id]);
    return result.changes;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}; 