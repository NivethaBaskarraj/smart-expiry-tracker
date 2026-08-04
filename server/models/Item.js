const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['produce', 'dairy', 'meat_seafood', 'bakery', 'pantry', 'beverage', 'other'],
      default: 'other',
    },
    quantityValue: { type: Number, default: 1, min: 0 },
    quantityUnit: {
      type: String,
      enum: ['unit', 'g', 'kg', 'ml', 'litre'],
      default: 'unit',
    },
    purchaseDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    // active = still in stock & not expired
    // used = user marked it as consumed/deleted intentionally
    // expired = passed expiry date without being used
    status: { type: String, enum: ['active', 'used', 'expired'], default: 'active' },
    // Prevents sending duplicate "expiring soon" emails every night
    expiringSoonNotified: { type: Boolean, default: false },
    expiredNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', ItemSchema);
