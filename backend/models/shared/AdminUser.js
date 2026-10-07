const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },

  role: {
    type: String,
    default: 'super_admin'
  },

  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  }
}, { timestamps: true });

adminUserSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

adminUserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('AdminUser', adminUserSchema);
