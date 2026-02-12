const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth/authenticate');
const ownerOnly = require('../middleware/auth/ownerOnlyMiddleware');

const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// 🔒 CREATE product → ONLY OWNER
router.post(
  '/',
  authenticate,
  ownerOnly,
  createProduct
);

// 🔒 READ products → ONLY OWNER
router.get(
  '/',
  authenticate,
  ownerOnly,
  getProducts
);

// 🔒 UPDATE product → ONLY OWNER
router.put(
  '/:id',
  authenticate,
  ownerOnly,
  updateProduct
);

// 🔒 DELETE product → ONLY OWNER
router.delete(
  '/:id',
  authenticate,
  ownerOnly,
  deleteProduct
);

module.exports = router;
