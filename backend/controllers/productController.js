const productModel = require('../models/productModel');
const auditModel = require('../models/auditModel');

exports.getAllProducts = (req, res) => {
  productModel.getAllProducts((err, products) => {
    if (err) return res.status(500).json({ message: 'Error al obtener productos' });
    res.json(products);
  });
};

exports.getProductById = (req, res) => {
  productModel.getProductById(req.params.id, (err, product) => {
    if (err) return res.status(500).json({ message: 'Error al obtener el producto' });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  });
};

exports.createProduct = (req, res) => {
  productModel.createProduct(req.body, (err, id) => {
    if (err) return res.status(500).json({ message: 'Error al crear producto' });
    auditModel.logAudit(req.user.id, req.user.username, 'crear', 'producto', id);
    res.status(201).json({ id });
  });
};

exports.updateProduct = (req, res) => {
  productModel.updateProduct(req.params.id, req.body, (err, changes) => {
    if (err) return res.status(500).json({ message: 'Error al actualizar producto' });
    if (!changes) return res.status(404).json({ message: 'Producto no encontrado' });
    auditModel.logAudit(req.user.id, req.user.username, 'editar', 'producto', req.params.id);
    res.json({ message: 'Producto actualizado' });
  });
};

exports.deleteProduct = (req, res) => {
  productModel.deleteProduct(req.params.id, (err, changes) => {
    if (err) return res.status(500).json({ message: 'Error al eliminar producto' });
    if (!changes) return res.status(404).json({ message: 'Producto no encontrado' });
    auditModel.logAudit(req.user.id, req.user.username, 'eliminar', 'producto', req.params.id);
    res.json({ message: 'Producto eliminado' });
  });
}; 