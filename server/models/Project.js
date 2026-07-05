const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
      default: 'General',
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    collectedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },

    coverImage: {
      type: String,
      default: '',
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },

    featured: {
      type: Boolean,
      default: false,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.virtual('remainingAmount').get(function () {
  return Math.max(Number(this.targetAmount || 0) - Number(this.collectedAmount || 0), 0);
});

projectSchema.virtual('progressPercent').get(function () {
  const target = Number(this.targetAmount || 0);
  const collected = Number(this.collectedAmount || 0);

  if (target <= 0) return 0;

  const percent = (collected / target) * 100;

  return Math.min(Math.round(percent), 100);
});

module.exports = mongoose.model('Project', projectSchema);