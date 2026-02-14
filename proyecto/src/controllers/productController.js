/**
 * src/controllers/productController.js
 * CRUD de productos usando Mongoose.
 */
const mongoose = require("mongoose");
const Product = require("../models/Product");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /products
 * Protegido (JWT)
 */
async function listProducts(req, res) {
  const products = await Product.find({})
    .populate("createdBy", "usuario")
    .populate("updatedBy", "usuario")
    .sort({ createdAt: -1 });
  return res.json(products);
}

/**
 * GET /products/:id
 */
async function getProduct(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: "ID inválido" });
  }

  const product = await Product.findOne({ _id: id, createdBy: req.user.id })
    .populate("createdBy", "usuario")
    .populate("updatedBy", "usuario");
  if (!product) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  return res.json(product);
}

/**
 * POST /products
 * Body: { name, price, stock, description }
 */
async function createProduct(req, res) {
  const { name, price, stock, description } = req.body;

  // Validación mínima
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ mensaje: "Campos requeridos: name, price, stock" });
  }

  const product = await Product.create({
    name,
    price,
    stock,
    description: description || "",
    createdBy: req.user.id,
    updatedBy: req.user.id
  });
  const populated = await Product.findById(product._id)
    .populate("createdBy", "usuario")
    .populate("updatedBy", "usuario");
  return res.status(201).json(populated);
}

/**
 * PUT /products/:id
 * Body: { name, price, stock, description }
 */
async function updateProduct(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: "ID inválido" });
  }

  // Permitimos actualizar solo campos enviados
  const update = {};
  const allowed = ["name", "price", "stock", "description"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  update.updatedBy = req.user.id;

  const product = await Product.findOneAndUpdate(
    { _id: id },
    update,
    { returnDocument: "after" }
  );

  if (!product) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  const populated = await Product.findById(product._id)
    .populate("createdBy", "usuario")
    .populate("updatedBy", "usuario");
  return res.json(populated);
}

/**
 * DELETE /products/:id
 */
async function deleteProduct(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ mensaje: "ID inválido" });
  }

  const deleted = await Product.findOneAndDelete({ _id: id });
  if (!deleted) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  return res.json({ mensaje: "Producto eliminado" });
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
