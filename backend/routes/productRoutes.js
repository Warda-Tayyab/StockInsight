const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');



router.post('/', createProduct);     // ✅ function
router.get('/', getProducts);        // ✅ function
router.put('/:id', updateProduct);   // ✅ function
router.delete('/:id', deleteProduct);// ✅ function

module.exports = router;
