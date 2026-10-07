const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const errors = require('../../utils/validation');
const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  firstName: { type: String, 
    required: [true, 'First name is required'] },
  
  lastName: { type: String },
  email: { type: String, 
    required: [true, 'Email is required'],
  match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
   },
googleId: { type: String },
authProvider: { 
  type: String, 
  enum: ['local', 'google'], 
  default: 'local' 
},
  passwordHash: { type: String, default: null },

  passwordSet: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  inviteToken: { type: String },  // store invite token per user
  resetPasswordToken: { type: String },
resetPasswordExpire: { type: Date },
activationCode: { type: String },
activationCodeExpire: { type: Date },
isActivated: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ['owner', 'manager', 'cashier', 'staff'], // staff = legacy alias of cashier
    default: 'cashier'
  },

  status: {
    type: String,
    enum: ['active', 'suspended' , 'invited'],
    default: 'invited'
  },

  notificationPrefs: {
    lowStockInApp: { type: Boolean, default: true },
    lowStockEmail: { type: Boolean, default: false },
    salesInApp: { type: Boolean, default: true },
    salesEmail: { type: Boolean, default: false },
  },

  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
  },
}, { timestamps: true });

// userSchema.methods.setPassword = async function (password) {
//   this.passwordHash = await bcrypt.hash(password, 10);
//   this.passwordSet = true;
// };
userSchema.methods.setPassword = async function (password) {

  const strongRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!password) {
      throw errors.PASSWORD_REQUIRED;
    }
    
    if (!strongRegex.test(password)) {
      throw errors.WEAK_PASSWORD;
    }
  this.passwordHash = await bcrypt.hash(password, 10);
  this.passwordSet = true;
};

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
