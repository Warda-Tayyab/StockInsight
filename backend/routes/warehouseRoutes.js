const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth/authMiddleware');

const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse
} = require('../controllers/warehouseController');

router.post(
  '/',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  createWarehouse
);

router.get(
  '/',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getWarehouses
);
router.get(
  '/:id',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  getWarehouseById
);
router.put(
  '/:id',
  authenticate,
  authorize({ roles: ['owner', 'manager'], requireTenantActive: true }),
  updateWarehouse
);

/**
 * SOFT DELETE WAREHOUSE
 */
router.delete(
  "/:id",
  authenticate,
  authorize({ roles: ["owner", "manager"], requireTenantActive: true }),
  deleteWarehouse
);

/**
 * GET ACTIVE WAREHOUSES ONLY
 */
router.get(
  "/status/active",
  authenticate,
  authorize({ roles: ["owner", "manager"], requireTenantActive: true }),
  async (req, res) => {
    try {
      const Warehouse = require("../models/Warehouse");

      const warehouses = await Warehouse.find({
        tenantId: req.user.tenantId,
        status: "active",
        isDeleted: false
      });

      res.json(warehouses);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);


module.exports = router;