require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../models/shared/AdminUser');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const admin = new AdminUser({
    email: 'inventoryinsights2102@gmail.com'
  });

  await admin.setPassword('meerabwarda');
  await admin.save();

  console.log('✅ Super Admin created');
  process.exit();
}

run();
