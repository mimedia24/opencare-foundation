const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    trxId: {
      type: String,
      required: true
    },
    paymentMethod: {
      type: String,
      default: 'bKash'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);