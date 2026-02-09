const Product = require('../models/tenant/Product');
const Tenant = require('../models/shared/Tenant');

/**
 * ✅ CREATE PRODUCT
 */

exports.createProduct = async (req, res) => {
  try {
    const {
      tenantId,
      name,
      categoryId,
      sku,
      costPrice,
      sellingPrice,
      quantity,
      unit,
      reorderLevel,
      supplierName,
      status,
      image
    } = req.body;

    // 🔴 Required field validations (user-friendly errors)
    if (!tenantId) return res.status(400).json({ message: 'Tenant id is required' });
    if (!name) return res.status(400).json({ message: 'Product name is required' });
    if (!categoryId) return res.status(400).json({ message: 'Category is required' });
    if (!sku) return res.status(400).json({ message: 'SKU is required' });
    if (costPrice === undefined) return res.status(400).json({ message: 'Cost price is required' });
    if (sellingPrice === undefined) return res.status(400).json({ message: 'Selling price is required' });
    if (quantity === undefined) return res.status(400).json({ message: 'Quantity is required' });
    if (!unit) return res.status(400).json({ message: 'Unit is required' });
    if (reorderLevel === undefined) return res.status(400).json({ message: 'Reorder level is required' });
    if (!supplierName) return res.status(400).json({ message: 'Supplier name is required' });

    // 🔍 Check tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
// 🔍 Check duplicate SKU for the same tenant
const existingProduct = await Product.findOne({ tenantId, sku });
if (existingProduct) {
  return res.status(400).json({ message: 'SKU already exists for this tenant' });
}

    // 🆕 Create product
    const product = await Product.create({
      tenantId,
      name,
      categoryId,
      sku,
      costPrice,
      sellingPrice,
      quantity,
      unit,
      reorderLevel,
      supplierName,
      status,
      image
    });

    res.status(201).json(product);

  } catch (err) {

    // 🔥 Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ errors });
    }

    // 🔁 Duplicate SKU error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    res.status(500).json({ message: err.message });
  }
};

/**
 * ✅ GET PRODUCTS (Tenant-wise)
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      tenantId,
      categoryId,
      status,
      supplierName,
      unit,
      minPrice,
      maxPrice,
      lowStock,
      search
    } = req.query;

    // 🔴 tenant required
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant id is required' });
    }

    // 🧠 filter object
    const filter = { tenantId };

    // 📂 category filter
    if (categoryId) filter.categoryId = categoryId;

    // 🟢 status filter
    if (status) filter.status = status;

    // 🧾 supplier filter
    if (supplierName) filter.supplierName = supplierName;

    // 📏 unit filter
    if (unit) filter.unit = unit;

    // 💰 price range filter
    if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = Number(maxPrice);
    }

    // ⚠️ low stock filter
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    // 🔍 search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name');

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 Check duplicate SKU if user is updating SKU
/**
 * ✅ UPDATE PRODUCT
 */
exports.updateProduct = async (req, res) => {
  try {
    const { tenantId } = req.body;

    // 🔴 Tenant validation
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant id is required' });
    }

    // 🔍 Check duplicate SKU if user is updating SKU
    if (req.body.sku) {
      const duplicate = await Product.findOne({
        tenantId,
        sku: req.body.sku,
        _id: { $ne: req.params.id } // ignore current product
      });
      if (duplicate) {
        return res.status(400).json({ message: 'SKU already exists for this tenant' });
      }
    }

    // ✏️ Update product only if belongs to same tenant
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found for this tenant'
      });
    }

    res.json(product);

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ errors });
    }

    res.status(500).json({ message: err.message });
  }
};


/**
 * ✅ DELETE PRODUCT
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { tenantId } = req.body;

    // 🔴 Tenant validation
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant id is required' });
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      tenantId
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found for this tenant'
      });
    }

    res.json({ message: 'Product deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
