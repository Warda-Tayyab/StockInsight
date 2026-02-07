require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const Category = require('../models/shared/Category');

const categories = [
  "Electronics",
  "Clothing / Apparel",
  "Grocery",
  "Cosmetics & Beauty",
  "Bags & Accessories",
  "Footwear",
  "Stationery",
  "Home & Kitchen",
  "Furniture",
  "Health & Pharmacy",
  "Sports & Fitness",
  "Toys & Baby Products",
  "Books & Education",
  "Hardware & Tools",
  "Jewellery",
  "Pet Supplies",
  "Automotive",
  "Digital Products",
  "Services",
  "Others"
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ DB Connected');

    for (const name of categories) {
      await Category.updateOne(
        { name },
        { $set: { name } },
        { upsert: true }
      );
    }

    console.log('🌱 Categories seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedCategories();
