// const express = require('express');
// const router = express.Router();

// const authenticate = require('../middleware/auth/authenticate');
// const ownerOnly = require('../middleware/auth/ownerOnlyMiddleware');

// const {
//   createProduct,
//   getProducts,
//   updateProduct,
//   deleteProduct
// } = require('../controllers/productController');

// // 🔒 CREATE product → ONLY OWNER
// router.post(
//   '/',
//   authenticate,
//   ownerOnly,
//   createProduct
// );

// // 🔒 READ products → ONLY OWNER
// router.get(
//   '/',
//   authenticate,
//   ownerOnly,
//   getProducts
// );

// // 🔒 UPDATE product → ONLY OWNER
// router.put(
//   '/:id',
//   authenticate,
//   ownerOnly,
//   updateProduct
// );

// // 🔒 DELETE product → ONLY OWNER
// router.delete(
//   '/:id',
//   authenticate,
//   ownerOnly,
//   deleteProduct
// );

// module.exports = router;




const express = require('express');
const router = express.Router();

// ✅ CHANGED: import from new unified middleware
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');

const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');


// 🔒 CREATE product → OWNER + ACTIVE TENANT
router.post(
  '/',
  authenticate,
  authorize({ roles: ['owner'], requireTenantActive: true }), // ✅ CHANGED
  createProduct
);

// 🔒 READ products → OWNER + ACTIVE TENANT
router.get(
  '/',
  authenticate,
  authorize({ roles: ['owner'], requireTenantActive: true }), // ✅ CHANGED
  getProducts
);

// 🔒 UPDATE product → OWNER + ACTIVE TENANT
router.put(
  '/:id',
  authenticate,
  authorize({ roles: ['owner'], requireTenantActive: true }), // ✅ CHANGED
  updateProduct
);

// 🔒 DELETE product → OWNER + ACTIVE TENANT
router.delete(
  '/:id',
  authenticate,
  authorize({ roles: ['owner'], requireTenantActive: true }), // ✅ CHANGED
  deleteProduct
);

module.exports = router;
