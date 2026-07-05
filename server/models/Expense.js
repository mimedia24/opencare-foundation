const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
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

    category: {
      type: String,
      trim: true,
      default: 'General Expense',
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    expenseDate: {
      type: Date,
      default: Date.now,
    },

    proofImage: {
      type: String,
      default: '',
    },

    proofLink: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['published', 'draft', 'hidden'],
      default: 'published',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);