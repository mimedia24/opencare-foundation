const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');

router.get('/', async (req, res) => {
  try {
    const donationResult = await Donation.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          totalDonation: { $sum: '$amount' }
        }
      }
    ]);

    const expenseResult = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalExpense: { $sum: '$amount' }
        }
      }
    ]);

    const totalDonation = donationResult.length > 0 ? donationResult[0].totalDonation : 0;
    const totalExpense = expenseResult.length > 0 ? expenseResult[0].totalExpense : 0;
    const availableFund = totalDonation - totalExpense;

    res.status(200).json({
      totalDonation,
      totalExpense,
      availableFund
    });
  } catch (error) {
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

module.exports = router;
