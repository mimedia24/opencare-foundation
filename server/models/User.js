const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      default: undefined,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
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

    profilePhoto: {
      type: String,
      default: '',
    },

    bloodGroup: {
      type: String,
      enum: ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      default: '',
    },

    isBloodDonor: {
      type: Boolean,
      default: false,
    },

    totalBloodDonations: {
      type: Number,
      default: 0,
    },

    lastBloodDonationDate: {
      type: Date,
      default: null,
    },

    nextEligibleDate: {
      type: Date,
      default: null,
    },

    isBloodDonorVerified: {
      type: Boolean,
      default: false,
    },


    isBanned: {
      type: Boolean,
      default: false,
    },

    banReason: {
      type: String,
      trim: true,
      default: '',
    },

    bannedAt: {
      type: Date,
      default: null,
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    isVolunteer: {
      type: Boolean,
      default: false,
    },

    volunteerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);