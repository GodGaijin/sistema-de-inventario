const categoryModel = require('../models/categoryModel');
const auditModel = require('../models/auditModel');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await categoryModel.getCategoryById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json(category);
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ message: 'Error al obtener la categoría' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    
    // Validar datos de entrada
    if (!req.body.name || req.body.name.trim() === '') {
      return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
    }
    
    const id = await categoryModel.createCategory(req.body);
    
    if (req.user && req.user.id) {
      try {
        await auditModel.logAudit(req.user.id, req.user.username, 'crear', 'categoría', id);
      } catch (auditError) {
        console.error('Error logging audit:', auditError);
        // No fallar la operación principal por un error de auditoría
      }
    }
    
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating category:', error);
    
    // Manejar errores específicos de la base de datos
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
    }
    
    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ message: 'Datos incompletos para crear la categoría' });
    }
    
    res.status(500).json({ 
      message: 'Error al crear categoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const changes = await categoryModel.updateCategory(req.params.id, req.body);
    if (!changes) return res.status(404).json({ message: 'Categoría no encontrada' });
    await auditModel.logAudit(req.user.id, req.user.username, 'editar', 'categoría', req.params.id);
    res.json({ message: 'Categoría actualizada' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error al actualizar categoría' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    
    const changes = await categoryModel.deleteCategory(req.params.id);
    if (!changes) return res.status(404).json({ message: 'Categoría no encontrada' });
    
    if (req.user && req.user.id) {
      try {
        await auditModel.logAudit(req.user.id, req.user.username, 'eliminar', 'categoría', req.params.id);
      } catch (auditError) {
        console.error('Error logging audit:', auditError);
        // No fallar la operación principal por un error de auditoría
      }
    }
    
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error.message && error.message.includes('asignada a uno o más productos')) {
      return res.status(400).json({ message: error.message });
    }
    
    // Manejar errores específicos de la base de datos
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ message: 'No se puede eliminar la categoría porque está siendo utilizada por productos' });
    }
    
    res.status(500).json({ 
      message: 'Error al eliminar categoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 