const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

router.post('/add', async (req, res) => {
  try {
    const { name, phone, amount, trxId } = req.body;

    const donation = new Donation({
      name,
      phone,
      amount,
      trxId
    });

    await donation.save();

    res.status(201).json({
      message: 'Donation added successfully',
      data: donation
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
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

router.get('/top', async (req, res) => {
  try {
    const topDonors = await Donation.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$phone',
          name: { $first: '$name' },
          phone: { $first: '$phone' },
          totalDonated: { $sum: '$amount' }
        }
      },
      { $sort: { totalDonated: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json(topDonors);
  } catch (error) {
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

router.get('/search/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const donations = await Donation.find({ phone }).sort({ createdAt: -1 });
    const total = donations.reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({
      phone,
      totalDonated: total,
      history: donations
    });
  } catch (error) {
    res.status(500).json({
      message: 'Something went wrong',
      error: error.message
    });
  }
});

module.exports = router;