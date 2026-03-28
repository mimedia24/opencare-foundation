const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

router.post('/add', async (req, res) => {
  try {
    const { title, amount, category } = req.body;

    const expense = new Expense({
      title,
      amount,
      category
    });

    await expense.save();

    res.status(201).json({
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

module.exports = router;