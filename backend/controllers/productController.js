const productModel = require('../models/productModel');
const auditModel = require('../models/auditModel');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const id = await productModel.createProduct(req.body);
    await auditModel.logAudit(req.user.id, req.user.username, 'crear', 'producto', id);
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const changes = await productModel.updateProduct(req.params.id, req.body);
    if (!changes) return res.status(404).json({ message: 'Producto no encontrado' });
    await auditModel.logAudit(req.user.id, req.user.username, 'editar', 'producto', req.params.id);
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const changes = await productModel.deleteProduct(req.params.id);
    if (!changes) return res.status(404).json({ message: 'Producto no encontrado' });
    await auditModel.logAudit(req.user.id, req.user.username, 'eliminar', 'producto', req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
}; 