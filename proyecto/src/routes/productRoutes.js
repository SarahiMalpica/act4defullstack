/**
 * src/routes/productRoutes.js
 * Rutas protegidas (JWT) para productos.
 */
const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const router = express.Router();

// Todas las rutas debajo requieren JWT
router.use(auth);

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
