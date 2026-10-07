// require('dotenv').config();
// const mongoose = require('mongoose');
// const AdminUser = require('../models/shared/AdminUser');

// async function run() {
//   try {
//     // 1️⃣ Connect to DB
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });

//     console.log('Connected to MongoDB ✅');

//     // 2️⃣ Check if admin already exists
//     const existing = await AdminUser.findOne({ email: 'inventoryinsights2102@gmail.com' });
//     if (existing) {
//       console.log('⚠️ Admin already exists');
//       process.exit();
//     }

//     // 3️⃣ Create new admin
//     const admin = new AdminUser({
//       email: 'inventoryinsights2102@gmail.com',
//       role: 'super_admin',   // Optional, default is super_admin
//       status: 'active'       // Optional, default is active
//     });

//     await admin.setPassword('meerabwarda');  // Hash password
//     await admin.save();

//     console.log('✅ Super Admin created');
//     process.exit();
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// }

// run();
