const express = require('express');
const router = express.Router();
const Category = require('../models/shared/Category');

// ✅ Create category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.create({ name });
    res.status(201).json(category);

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    res.status(500).json({ message: err.message });
  }
});


// ✅ Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name && !status) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, status },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
const Product = require('../models/shared/Product');

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const productsCount = await Product.countDocuments({
      categoryId: req.params.id
    });

    if (productsCount > 0) {
      return res.status(400).json({
        message: 'Category has products. Deactivate instead.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
