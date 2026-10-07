const Product = require('../models/tenant/Product');
const Tenant = require('../models/shared/Tenant');
const Stock = require('../models/tenant/Stock');
const { aggregateStockByProduct } = require('../utils/locationStockHelper');
const { getPurchasedProductIds } = require('../utils/purchaseReportHelpers');
 const { v4: uuidv4 } = require('uuid');

const mergePosDuplicateProducts = (products) => {
  const groups = new Map();

  for (const p of products) {
    const catKey = p.categoryId?._id ? String(p.categoryId._id) : 'none';
    const key = `${String(p.name || '').trim().toLowerCase()}::${catKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  const merged = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    const sorted = [...group].sort((a, b) => {
      if (a.barcode && !b.barcode) return -1;
      if (!a.barcode && b.barcode) return 1;
      return (b.availableStock || 0) - (a.availableStock || 0);
    });
    const primary = sorted[0];
    const totalStock = group.reduce((sum, row) => sum + (row.availableStock || 0), 0);

    merged.push({
      ...primary,
      availableStock: totalStock,
      storeStock: totalStock,
      totalStock,
      quantity: totalStock,
      needsSetup: group.some((row) => row.needsSetup),
    });
  }

  return merged;
};
/**
 * ✅ CREATE PRODUCT
 */

exports.createProduct = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId; // 🔥 FROM TOKEN
    const {
      name,
      categoryId,
      sku,
      barcode,
      costPrice,
      sellingPrice,
      unit,
      reorderLevel,
      supplierName,
      status,
      image
    } = req.body;

    // If multer provided a file, construct a public URL
    let imageUrl = image;
    if (req.file) {
      const host = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${host}/uploads/${req.file.filename}`;
    }
    const normalizedSku = sku ? sku.trim().toUpperCase() : null;
    const normalizedBarcode = barcode ? String(barcode).trim() : '';

    if (!name) return res.status(400).json({ message: 'Product name is required' });
    if (!categoryId) return res.status(400).json({ message: 'Category is required' });
    if (!sku || !sku.trim()) {
      return res.status(400).json({ message: 'SKU is required' });
    }
    if (costPrice === undefined) return res.status(400).json({ message: 'Cost price is required' });
    if (sellingPrice === undefined) return res.status(400).json({ message: 'Selling price is required' });
   // if (quantity === undefined) return res.status(400).json({ message: 'Quantity is required' });
    if (!unit) return res.status(400).json({ message: 'Unit is required' });
    if (
      reorderLevel === undefined ||
      reorderLevel === null ||
      Number(reorderLevel) <= 0
    ) {
      return res.status(400).json({
        message: "Reorder level must be greater than 0"
      });
    }
    if (!supplierName) return res.status(400).json({ message: 'Supplier name is required' });

    // 🔍 Check tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // 🔍 Check duplicate SKU for the same tenant
    const existingProduct = await Product.findOne({
      tenantId,
      sku: normalizedSku
    });

    if (existingProduct) {
      return res.status(400).json({ message: 'SKU already exists in this tenant' });
    }

    const isPending =
      req.body.setupStatus === 'pending' ||
      !normalizedBarcode ||
      !categoryId ||
      Number(sellingPrice) <= 0;

    if (!isPending && !normalizedBarcode) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    if (normalizedBarcode) {
      const existingBarcode = await Product.findOne({
        tenantId,
        barcode: normalizedBarcode
      });

      if (existingBarcode) {
        return res.status(400).json({ message: 'Barcode already exists in this tenant' });
      }
    }

    // 🆕 Create product
    const product = await Product.create({
      tenantId,
      name,
      categoryId: categoryId || null,
      sku: normalizedSku,
      barcode: normalizedBarcode || null,
      costPrice,
      sellingPrice: sellingPrice || 0,
      unit,
      reorderLevel,
      supplierName,
      status: isPending ? 'inactive' : (status || 'active'),
      setupStatus: isPending ? 'pending' : 'ready',
      image: imageUrl
    });

    res.status(201).json(product);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'SKU or barcode already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};


/**
 * ✅ GET PRODUCTS (Tenant-wise)
 */
exports.getProducts = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId; // 🔥 TOKEN

    const {
      categoryId,
      status,
      supplierName,
      unit,
      minPrice,
      maxPrice,
      lowStock,
      search,
      posReady,
      setupStatus,
      stockScope,
    } = req.query;

    const filter = { tenantId };
    if (status) {
      filter.status = status;
    }
    if (posReady === 'true') {
      const purchasedIds = await getPurchasedProductIds(tenantId);
      if (!purchasedIds.size) {
        return res.json([]);
      }
      filter._id = { $in: [...purchasedIds] };
    } else if (setupStatus) {
      filter.setupStatus = setupStatus;
    }
    if (categoryId) filter.categoryId = categoryId;
    if (supplierName) filter.supplierName = supplierName;
    if (unit) filter.unit = unit;
    if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    //sorting
    const { sortBy } = req.query;
    let sort = {};
    if (sortBy) {
      switch(sortBy) {
        case "newest":
          sort = { createdAt: -1 }; // newest first
          break;
        case "oldest":
          sort = { createdAt: 1 };  // oldest first
          break;
        case "lowToHigh":
          sort = { sellingPrice: 1 }; // price low → high
          break;
        case "highToLow":
          sort = { sellingPrice: -1 }; // price high → low
          break;
        default:
          sort = {}; // no sorting
      }
    }

    //fetch products
    let products = await Product.find(filter)
    .populate('categoryId', 'name')
    .sort(sort);

    const productIds = products.map((p) => p._id);
    const storeOnly = posReady === 'true' || stockScope === 'store';
    const stockByProductId = await aggregateStockByProduct(tenantId, productIds, { storeOnly });

    products = products.map((p) => {
      const availableStock = stockByProductId.get(String(p._id)) ?? 0;
      const obj = p.toObject();
      obj.availableStock = availableStock;
      obj.storeStock = storeOnly ? availableStock : undefined;
      obj.barcode = p.barcode;
      obj.totalStock = availableStock;
      obj.quantity = availableStock;
      if (posReady === 'true') {
        obj.needsSetup = p.setupStatus !== 'ready' || p.status !== 'active';
      }
      return obj;
    });

    // Merge duplicate products with same name + category
    products = mergePosDuplicateProducts(products);

    // 🔹 Filter lowStock if requested
    if (lowStock === 'true') {
      products = products.filter((p) => p.availableStock > 0 && p.availableStock <= p.reorderLevel);
    }

    // 🔹 Return products
    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getProductByBarcode = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const rawCode = String(req.params.code || '').trim();

    if (!rawCode) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    const normalizedSku = rawCode.toUpperCase();

    const purchasedIds = await getPurchasedProductIds(tenantId);
    if (!purchasedIds.size) {
      return res.status(404).json({ message: 'No product found for this barcode' });
    }

    const purchasedFilter = {
      tenantId,
      _id: { $in: [...purchasedIds] },
    };

    // Match barcode (exact, case-sensitive for EAN) or SKU fallback for manual entry
    let product = await Product.findOne({
      ...purchasedFilter,
      barcode: rawCode,
    }).populate('categoryId', 'name');

    if (!product) {
      product = await Product.findOne({
        ...purchasedFilter,
        barcode: { $regex: new RegExp(`^${rawCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      }).populate('categoryId', 'name');
    }

    if (!product) {
      product = await Product.findOne({
        ...purchasedFilter,
        sku: normalizedSku,
      }).populate('categoryId', 'name');
    }

    if (!product) {
      return res.status(404).json({ message: 'No product found for this barcode' });
    }

    const { getStoreStockForProductGroup } = require('../utils/locationStockHelper');
    const availableStock = await getStoreStockForProductGroup(tenantId, product._id);

    const obj = product.toObject();
    obj.availableStock = availableStock;
    obj.totalStock = availableStock;
    obj.quantity = availableStock;
    obj.needsSetup = product.setupStatus !== 'ready' || product.status !== 'active';

    res.json(obj);
  } catch (err) {
    console.error('getProductByBarcode error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const productId = req.params.id;

    // Find product belonging to tenant
    const product = await Product.findOne({ _id: productId, tenantId })
      .populate('categoryId', 'name');

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Fetch batches from Batch model
    const Batch = require('../models/tenant/Batch');
    const batchList = await Batch.find({ productId, tenantId })
      .populate('warehouseId', 'name')
      .sort({ receivedDate: -1 });

    const formattedBatches = batchList.map(b => ({
      _id: b._id,
      batchNumber: b.batchNumber,
      quantity: b.remainingQty,
      costPrice: b.purchasePrice ?? product.costPrice ?? 0,
      sellingPrice: product.sellingPrice ?? 0,
      vendorName: product.supplierName || '—',
      barcode: product.barcode || '—',
      location: b.warehouseId?.name || 'Store/Warehouse',
      receivedDate: b.receivedDate,
      expiryDate: b.expiryDate,
      status:
        b.expiryDate && new Date(b.expiryDate) < new Date()
          ? 'expired'
          : 'active'
    }));

    res.json({ ...product.toObject(), batches: formattedBatches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * ✅ UPDATE PRODUCT
 */
exports.updateProduct = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant id is required' });
    }

    const productBefore = await Product.findOne({ _id: req.params.id, tenantId });
    if (!productBefore) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.body.reorderLevel !== undefined) {
      if (Number(req.body.reorderLevel) <= 0) {
        return res.status(400).json({
          message: 'Reorder level must be greater than 0',
        });
      }
    }

    if (req.body.sku) {
      const normalizedSku = req.body.sku.trim().toUpperCase();

      const duplicate = await Product.findOne({
        tenantId,
        sku: normalizedSku,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(400).json({ message: 'SKU already exists in this tenant' });
      }

      req.body.sku = normalizedSku;
    }

    if (req.body.barcode !== undefined) {
      const normalizedBarcode = String(req.body.barcode || '').trim();

      if (productBefore.setupStatus !== 'pending' && !normalizedBarcode) {
        return res.status(400).json({ message: 'Barcode is required' });
      }

      if (normalizedBarcode) {
        const duplicateBarcode = await Product.findOne({
          tenantId,
          barcode: normalizedBarcode,
          _id: { $ne: req.params.id },
        });

        if (duplicateBarcode) {
          return res.status(400).json({ message: 'Barcode already exists in this tenant' });
        }

        req.body.barcode = normalizedBarcode;
      }
    }

    const nextCategoryId =
      req.body.categoryId !== undefined && req.body.categoryId !== ''
        ? req.body.categoryId
        : productBefore.categoryId;
    const nextBarcode =
      req.body.barcode !== undefined
        ? String(req.body.barcode || '').trim()
        : productBefore.barcode;
    const nextSellingPrice =
      req.body.sellingPrice !== undefined && req.body.sellingPrice !== ''
        ? Number(req.body.sellingPrice)
        : Number(productBefore.sellingPrice);

    const completingSetup =
      req.body.setupStatus === 'ready' ||
      (productBefore.setupStatus === 'pending' &&
        nextCategoryId &&
        nextBarcode &&
        nextSellingPrice > 0);

    if (completingSetup) {
      if (!nextCategoryId) {
        return res.status(400).json({ message: 'Category is required to complete product setup' });
      }
      if (!nextBarcode) {
        return res.status(400).json({ message: 'Barcode is required to complete product setup' });
      }
      if (nextSellingPrice <= 0) {
        return res.status(400).json({ message: 'Selling price is required to complete product setup' });
      }

      req.body.setupStatus = 'ready';
      req.body.status = 'active';
      req.body.categoryId = nextCategoryId;
      req.body.barcode = nextBarcode;
      req.body.sellingPrice = nextSellingPrice;
    }

    if (req.file) {
      const host = `${req.protocol}://${req.get('host')}`;
      req.body.image = `${host}/uploads/${req.file.filename}`;
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Remove empty duplicate pending rows (same name, no stock) after setup completes once
    if (product.setupStatus === 'ready') {
      const nameRegex = new RegExp(
        `^${String(product.name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        'i'
      );
      const duplicatePending = await Product.find({
        tenantId,
        setupStatus: 'pending',
        _id: { $ne: product._id },
        name: nameRegex,
      }).select('_id');

      for (const dup of duplicatePending) {
        const stockRow = await Stock.findOne({
          tenantId,
          productId: dup._id,
          quantity: { $gt: 0 },
        });
        if (!stockRow) {
          await Product.deleteOne({ _id: dup._id, tenantId });
        }
      }
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
    const tenantId = req.auth.tenantId;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { status: "inactive" },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
