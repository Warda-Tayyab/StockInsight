require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const Category = require('../models/shared/Category');

// 🔴 JIS TENANT KE LIYE SEED KARNA HAI
const TENANT_ID = '697d415d6d8c6dc9bd7b9164';

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
        {
          tenantId: TENANT_ID,
          name: name
        },
        {
          $set: {
            tenantId: TENANT_ID,
            name: name,
            status: 'active'
          }
        },
        { upsert: true }
      );
    }

    console.log('🌱 Tenant-wise categories seeded successfully');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seedCategories();
