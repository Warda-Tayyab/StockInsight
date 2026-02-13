const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth/authenticate');
const ownerOnly = require('../middleware/auth/ownerOnlyMiddleware');

const Category = require('../models/tenant/Category');
const Product = require('../models/tenant/Product');


// ✅ CREATE CATEGORY (OWNER ONLY)
router.post(
  '/',
  authenticate,
  ownerOnly,
  async (req, res) => {
    try {
      const tenantId = req.auth.tenantId;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      const category = await Category.create({ tenantId, name });
      res.status(201).json(category);

    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({
          message: 'Category already exists for this tenant'
        });
      }
      res.status(500).json({ message: err.message });
    }
  }
);


// ✅ GET CATEGORIES (OWNER ONLY)
router.get(
  '/',
  authenticate,
  ownerOnly,
  async (req, res) => {
    try {
      const tenantId = req.auth.tenantId;

      const categories = await Category.find({ tenantId });
      res.json(categories);

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// ✅ UPDATE CATEGORY (OWNER ONLY)
router.put(
  '/:id',
  authenticate,
  ownerOnly,
  async (req, res) => {
    try {
      const tenantId = req.auth.tenantId;
      const { name, status } = req.body;

      const category = await Category.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { name, status },
        { new: true, runValidators: true }
      );

      if (!category) {
        return res.status(404).json({
          message: 'Category not found'
        });
      }

      res.json(category);

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// ✅ DELETE CATEGORY (OWNER ONLY)
router.delete(
  '/:id',
  authenticate,
  ownerOnly,
  async (req, res) => {
    try {
      const tenantId = req.auth.tenantId;

      // 🔒 Check if category has products
      const productsCount = await Product.countDocuments({
        categoryId: req.params.id,
        tenantId
      });

      if (productsCount > 0) {
        return res.status(400).json({
          message: 'Category has products. Deactivate instead.'
        });
      }

      const category = await Category.findOneAndDelete({
        _id: req.params.id,
        tenantId
      });

      if (!category) {
        return res.status(404).json({
          message: 'Category not found'
        });
      }

      res.json({ message: 'Category deleted successfully' });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
