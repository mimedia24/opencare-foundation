const mongoose = require('mongoose');

const volunteerApplicationSchema = new mongoose.Schema(
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
      required: true,
      trim: true,
    },

    note: {
      type: String,
      default: '',
      trim: true,
    },

    photo: {
      type: String,
      required: true,
    },

    nidFront: {
      type: String,
      required: true,
    },

    nidBack: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    adminNote: {
      type: String,
      default: '',
      trim: true,
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

module.exports = mongoose.model('VolunteerApplication', volunteerApplicationSchema);