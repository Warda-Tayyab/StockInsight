const Warehouse = require('../models/tenant/Warehouse');

/**
 * ============================================
 * 1. CREATE WAREHOUSE
 * ============================================
 */
exports.createWarehouse = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    const { code } = req.body;

    // ✅ PREVENT DUPLICATE BEFORE CREATE 
    if (code) {
      const existing = await Warehouse.findOne({
        tenantId,
        code: code.trim()
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Warehouse code already exists"
        });
      }
    }

    const warehouse = await Warehouse.create({
      tenantId,
      ...req.body
    });

    return res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: warehouse
    });

  } catch (err) {

    // ❌ Duplicate key fallback safety (DB level protection)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {}).find(
        key => key !== "tenantId"
      );

      const message =
        field === "code"
          ? "Warehouse code already exists"
          : `${field} already exists`;

      return res.status(400).json({
        success: false,
        message
      });
    }

    // ❌ Validation error
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", ")
      });
    }

    // ❌ Generic error
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating warehouse"
    });
  }
};

/**
 * ============================================
 * 2. GET ALL WAREHOUSES
 * ============================================
 */
exports.getWarehouses = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { search, status } = req.query;

    // Build search filter
    const filter = { tenantId, isDeleted: false };

    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive
      filter.$or = [
        { name: regex },
        { code: regex },
        { city: regex },
        { contactPerson: regex }
      ];
    }
    if (status) {
      filter.status = status;
    }

    const warehouses = await Warehouse.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: warehouses.length,
      data: warehouses
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouses"
    });
  }
};


/**
 * ============================================
 * 3. GET SINGLE WAREHOUSE
 * ============================================
 */
exports.getWarehouseById = async (req, res) => {
  try {

    const tenantId = req.auth.tenantId;
    const { id } = req.params;

    const warehouse = await Warehouse.findOne({
      _id: id,
      tenantId,
      isDeleted: false
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    res.json({
      success: true,
      data: warehouse
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouse"
    });

  }
};


/**
 * ============================================
 * 4. UPDATE WAREHOUSE
 * ============================================
 */
exports.updateWarehouse = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const { id } = req.params;

    // ✅ 1. CHECK DUPLICATE BEFORE UPDATE
    if (req.body.code) {
      const existingCode = await Warehouse.findOne({
        tenantId,
        code: req.body.code.trim(),
        _id: { $ne: id }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: "Warehouse code already exists"
        });
      }
    }

    // ✅ 2. NOW UPDATE SAFELY
    const warehouse = await Warehouse.findOneAndUpdate(
      {
        _id: id,
        tenantId,
        isDeleted: false
      },
      {
        ...req.body,
        ...(req.body.code && { code: req.body.code.trim() })
      },
      {
        new: true,
        runValidators: true
      }
    );

    // ❌ NOT FOUND
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // ✅ SUCCESS
    return res.json({
      success: true,
      message: "Warehouse updated successfully",
      data: warehouse
    });

  } catch (err) {

    // ❌ SAFETY NET (DB constraint fallback)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];

      return res.status(400).json({
        success: false,
        message:
          field === "code"
            ? "Warehouse code already exists"
            : `${field} already exists`
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update warehouse"
    });
  }
};

/**
 * ============================================
 * 5. DELETE WAREHOUSE (SOFT DELETE)
 * ============================================
 */
exports.deleteWarehouse = async (req, res) => {
  try {

    const tenantId = req.auth.tenantId;
    const { id } = req.params;

    const warehouse = await Warehouse.findOneAndUpdate(
      {
        _id: id,
        tenantId
      },
      {
        isDeleted: true
      },
      {
        new: true
      }
    );

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    res.json({
      success: true,
      message: "Warehouse deleted successfully"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Failed to delete warehouse"
    });

  }
};