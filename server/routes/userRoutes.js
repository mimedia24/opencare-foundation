const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/add', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    res.status(201).json({
      message: 'User saved successfully',
      data: user
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
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

module.exports = router;