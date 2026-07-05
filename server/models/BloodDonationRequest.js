const mongoose = require('mongoose');

const bloodDonationRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
      default: '',
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      required: true,
    },

    donationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    proofImage: {
      type: String,
      required: true,
    },

    note: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    adminNote: {
      type: String,
      trim: true,
      default: '',
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodDonationRequest', bloodDonationRequestSchema);