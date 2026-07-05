const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const BloodDonationRequest = require('../models/BloodDonationRequest');
const protect = require('../middlewares/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'blood-donations');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Admin access required.',
  });
};

const calculateNextEligibleDate = (donationDate) => {
  const nextDate = new Date(donationDate);
  nextDate.setDate(nextDate.getDate() + 90);
  return nextDate;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const safeName =
      'blood-proof-' +
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP image files are allowed.'), false);
  }

  cb(null, true);
};

const uploadProofImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
}).single('proofImage');

const handleProofUpload = (req, res, next) => {
  uploadProofImage(req, res, (error) => {
    if (error) {
      let message = error.message || 'Proof image upload failed.';

      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'Proof image is too large. Maximum allowed size is 20 MB.';
      }

      return res.status(400).json({
        message,
      });
    }

    next();
  });
};

const getProofImageUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/blood-donations/${filename}`;
};

const deleteUploadedFile = (fileUrl) => {
  try {
    if (!fileUrl) return;

    const filename = path.basename(fileUrl);
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log('Blood proof image delete failed:', error.message);
  }
};

// Donor submits blood donation proof request
router.post('/request', protect, handleProofUpload, async (req, res) => {
  try {
    const { donationDate, note } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: 'Proof image is required.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      deleteUploadedFile(getProofImageUrl(req, req.file.filename));

      return res.status(404).json({
        message: 'User not found.',
      });
    }

    if (!user.isBloodDonor) {
      deleteUploadedFile(getProofImageUrl(req, req.file.filename));

      return res.status(400).json({
        message: 'You must be a blood donor before submitting a blood donation proof.',
      });
    }

    if (!user.bloodGroup) {
      deleteUploadedFile(getProofImageUrl(req, req.file.filename));

      return res.status(400).json({
        message: 'Please add your blood group first.',
      });
    }

    const existingPendingRequest = await BloodDonationRequest.findOne({
      user: user._id,
      status: 'pending',
    });

    if (existingPendingRequest) {
      deleteUploadedFile(getProofImageUrl(req, req.file.filename));

      return res.status(400).json({
        message:
          'You already have a pending blood donation request. Please wait for admin approval.',
      });
    }

    const finalDonationDate = donationDate ? new Date(donationDate) : new Date();

    if (Number.isNaN(finalDonationDate.getTime())) {
      deleteUploadedFile(getProofImageUrl(req, req.file.filename));

      return res.status(400).json({
        message: 'Invalid donation date.',
      });
    }

    const request = await BloodDonationRequest.create({
      user: user._id,
      name: user.name,
      phone: user.phone,
      district: user.district,
      address: user.address,
      bloodGroup: user.bloodGroup,
      donationDate: finalDonationDate,
      proofImage: getProofImageUrl(req, req.file.filename),
      note: note ? note.trim() : '',
      status: 'pending',
    });

    res.status(201).json({
      message: 'Blood donation proof submitted successfully. Waiting for admin approval.',
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Blood donation proof submit failed.',
      error: error.message,
    });
  }
});

// Logged-in donor can see own blood donation requests
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await BloodDonationRequest.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      total: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get your blood donation requests.',
      error: error.message,
    });
  }
});

// Admin can see all blood donation requests
router.get('/admin/requests', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await BloodDonationRequest.find(filter)
      .populate('user', 'name phone email district address profilePhoto bloodGroup totalBloodDonations lastBloodDonationDate nextEligibleDate isBloodDonorVerified')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get blood donation requests.',
      error: error.message,
    });
  }
});

// Admin approve blood donation proof
router.put('/admin/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const request = await BloodDonationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: 'Blood donation request not found.',
      });
    }

    if (request.status === 'approved') {
      return res.status(400).json({
        message: 'This blood donation request is already approved.',
      });
    }

    if (request.status === 'rejected') {
      return res.status(400).json({
        message: 'Rejected request cannot be approved again.',
      });
    }

    const user = await User.findById(request.user);

    if (!user) {
      return res.status(404).json({
        message: 'Donor user not found.',
      });
    }

    const donationDate = request.donationDate || new Date();
    const nextEligibleDate = calculateNextEligibleDate(donationDate);

    request.status = 'approved';
    request.adminNote = adminNote ? adminNote.trim() : '';
    request.approvedAt = new Date();
    request.rejectedAt = null;

    user.isBloodDonor = true;
    user.isBloodDonorVerified = true;
    user.totalBloodDonations = Number(user.totalBloodDonations || 0) + 1;
    user.lastBloodDonationDate = donationDate;
    user.nextEligibleDate = nextEligibleDate;

    await request.save();
    await user.save();

    res.status(200).json({
      message: 'Blood donation request approved successfully.',
      request,
      donor: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        district: user.district,
        address: user.address,
        profilePhoto: user.profilePhoto,
        bloodGroup: user.bloodGroup,
        totalBloodDonations: user.totalBloodDonations,
        lastBloodDonationDate: user.lastBloodDonationDate,
        nextEligibleDate: user.nextEligibleDate,
        isBloodDonorVerified: user.isBloodDonorVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Blood donation request approval failed.',
      error: error.message,
    });
  }
});

// Admin reject blood donation proof
router.put('/admin/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const request = await BloodDonationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: 'Blood donation request not found.',
      });
    }

    if (request.status === 'approved') {
      return res.status(400).json({
        message: 'Approved request cannot be rejected.',
      });
    }

    if (request.status === 'rejected') {
      return res.status(400).json({
        message: 'This blood donation request is already rejected.',
      });
    }

    request.status = 'rejected';
    request.adminNote = adminNote ? adminNote.trim() : '';
    request.rejectedAt = new Date();
    request.approvedAt = null;

    await request.save();

    res.status(200).json({
      message: 'Blood donation request rejected successfully.',
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Blood donation request rejection failed.',
      error: error.message,
    });
  }
});

module.exports = router;