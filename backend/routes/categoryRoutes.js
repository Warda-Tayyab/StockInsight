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

module.exports = router;
