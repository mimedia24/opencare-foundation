const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      default: 'general'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);