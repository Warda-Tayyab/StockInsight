const express = require('express');
const router = express.Router();
const Category = require('../models/shared/Category');
const Product = require('../models/shared/Product');

// ✅ Create category
router.post('/', async (req, res) => {
  try {
    const { tenantId, name } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant id is required' });
    }

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
});


// ✅ Get all categories
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant id is required' });
    }

    const categories = await Category.find({ tenantId });
    res.json(categories);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const { tenantId, name, status } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant id is required' });
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { name, status },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found for this tenant' });
    }

    res.json(category);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant id is required' });
    }

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
      return res.status(404).json({ message: 'Category not found for this tenant' });
    }

    res.json({ message: 'Category deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
