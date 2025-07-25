const db = require('./database');

const getAllCategories = async () => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    return result.rows || result;
  } catch (error) {
    throw error;
  }
};

const getCategoryById = async (id) => {
  try {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows ? result.rows[0] : result[0];
  } catch (error) {
    throw error;
  }
};

const createCategory = async (category) => {
  try {
    const { name, description } = category;
    
    // Validar que el nombre no esté vacío
    if (!name || name.trim() === '') {
      throw new Error('El nombre de la categoría es requerido');
    }
    
    const result = await db.run(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
      [name.trim(), description || '']
    );
    
    // Extraer el ID del resultado
    let id;
    if (result.rows && result.rows.length > 0) {
      id = result.rows[0].id;
    } else if (result.lastID) {
      id = result.lastID;
    } else {
      throw new Error('No se pudo obtener el ID de la categoría creada');
    }
    
    return id;
  } catch (error) {
    console.error('Error in createCategory:', error);
    throw error;
  }
};

const updateCategory = async (id, category) => {
  try {
    const { name, description } = category;
    const result = await db.run(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3',
      [name, description, id]
    );
    return result.changes;
  } catch (error) {
    throw error;
  }
};

const deleteCategory = async (id) => {
  try {
    // Check if any product uses this category
    const checkResult = await db.query('SELECT COUNT(*) as count FROM products WHERE category_id = $1', [id]);
    const count = checkResult.rows ? checkResult.rows[0].count : checkResult[0].count;
    
    if (count > 0) {
      throw new Error('Cannot delete category: it is assigned to one or more products.');
    }
    
    // Safe to delete
    const result = await db.run('DELETE FROM categories WHERE id = $1', [id]);
    return result.changes;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}; 