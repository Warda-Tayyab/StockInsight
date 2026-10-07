const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  tenantId: mongoose.Schema.Types.ObjectId,
   name: String,
   productId: mongoose.Schema.Types.ObjectId,
     type: { type: String, default: 'batch' },
  seq: { type: Number, default: 0 }
});
counterSchema.index({ tenantId: 1, name: 1,productId: 1, type: 1 }, { unique: true });
module.exports = mongoose.model('Counter', counterSchema);