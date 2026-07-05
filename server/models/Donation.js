const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    projectTitle: {
      type: String,
      trim: true,
      default: '',
    },

    fundCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FundCategory',
      default: null,
    },

    fundCategoryName: {
      type: String,
      trim: true,
      default: 'General Donation',
    },

    donorName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'nagad', 'rocket', 'bank', 'card', 'other'],
      default: 'bkash',
    },

    transactionId: {
      type: String,
      trim: true,
      default: '',
    },

    proofImage: {
      type: String,
      default: '',
    },

    note: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },

    adminNote: {
      type: String,
      trim: true,
      default: '',
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    source: {
      type: String,
      enum: ['website', 'admin'],
      default: 'website',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);