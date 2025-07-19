const categoryModel = require('../models/categoryModel');
const auditModel = require('../models/auditModel');

exports.getAllCategories = (req, res) => {
  categoryModel.getAllCategories((err, categories) => {
    if (err) return res.status(500).json({ message: 'Error al obtener categorías' });
    res.json(categories);
  });
};

exports.getCategoryById = (req, res) => {
  categoryModel.getCategoryById(req.params.id, (err, category) => {
    if (err) return res.status(500).json({ message: 'Error al obtener la categoría' });
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json(category);
  });
};

exports.createCategory = (req, res) => {
  categoryModel.createCategory(req.body, (err, id) => {
    if (err) return res.status(500).json({ message: 'Error al crear categoría' });
    auditModel.logAudit(req.user.id, req.user.username, 'crear', 'categoría', id);
    res.status(201).json({ id });
  });
};

exports.updateCategory = (req, res) => {
  categoryModel.updateCategory(req.params.id, req.body, (err, changes) => {
    if (err) return res.status(500).json({ message: 'Error al actualizar categoría' });
    if (!changes) return res.status(404).json({ message: 'Categoría no encontrada' });
    auditModel.logAudit(req.user.id, req.user.username, 'editar', 'categoría', req.params.id);
    res.json({ message: 'Categoría actualizada' });
  });
};

exports.deleteCategory = (req, res) => {
  categoryModel.deleteCategory(req.params.id, (err, changes) => {
    if (err) {
      if (err.message && err.message.includes('asignada a uno o más productos')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Error al eliminar categoría' });
    }
    if (!changes) return res.status(404).json({ message: 'Categoría no encontrada' });
    auditModel.logAudit(req.user.id, req.user.username, 'eliminar', 'categoría', req.params.id);
    res.json({ message: 'Categoría eliminada' });
  });
}; 