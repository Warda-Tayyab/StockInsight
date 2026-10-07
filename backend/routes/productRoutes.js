
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB per file

// ✅ CHANGED: import from new unified middleware
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');

const {
  createProduct,
  getProducts,
  getProductByBarcode,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');


// 🔒 CREATE product → OWNER + ACTIVE TENANT
router.post(
  '/',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }), // ✅ CHANGED
  upload.single('image'),
  createProduct
);

// 🔒 READ products → POS roles (cashier needs catalog for sales)
router.get(
  '/',
  authenticate,
  authorize({ roles: ['owner', 'manager', 'cashier', 'staff'], requireTenantActive: true }),
  getProducts
);

// POS barcode lookup — must be registered before /:id
router.get(
  '/barcode/:code',
  authenticate,
  authorize({ roles: ['owner', 'manager', 'cashier', 'staff'], requireTenantActive: true }),
  getProductByBarcode
);

// GET single product
router.get('/:id',
  authenticate,
  authorize({ roles: ['owner', 'manager', 'cashier', 'staff'], requireTenantActive: true }),
  getProductById
);
// 🔒 UPDATE product → OWNER + ACTIVE TENANT
router.put(
  '/:id',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }), // ✅ CHANGED
  upload.single('image'),
  updateProduct
);

// 🔒 DELETE product → OWNER + ACTIVE TENANT
router.delete(
  '/:id',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }), // ✅ CHANGED
  deleteProduct
);

module.exports = router;
