const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true },

  passwordHash: { type: String, default: null },

  passwordSet: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'staff'],
    default: 'staff'
  },

  status: {
    type: String,
    enum: ['active', 'suspended' , 'invited'],
    default: 'invited'
  }
}, { timestamps: true });

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
  this.passwordSet = true;
};


userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
