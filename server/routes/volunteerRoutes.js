const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const VolunteerApplication = require('../models/VolunteerApplication');
const User = require('../models/User');
const protect = require('../middlewares/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'volunteers');

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const safeName =
      file.fieldname +
      '-' +
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

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'nidFront', maxCount: 1 },
  { name: 'nidBack', maxCount: 1 },
]);

const handleUpload = (req, res, next) => {
  uploadFields(req, res, (error) => {
    if (error) {
      let message = error.message || 'File upload failed.';

      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'Image file is too large. Maximum allowed size is 20 MB per image.';
      }

      return res.status(400).json({
        message,
      });
    }

    next();
  });
};

const getFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/volunteers/${filename}`;
};

// User applies as volunteer
router.post('/apply', protect, handleUpload, async (req, res) => {
  try {
    const { district, note } = req.body;

    if (!district) {
      return res.status(400).json({
        message: 'District is required.',
      });
    }

    if (!req.files?.photo?.[0] || !req.files?.nidFront?.[0] || !req.files?.nidBack?.[0]) {
      return res.status(400).json({
        message: 'Photo, NID front and NID back are required.',
      });
    }

    const existingApplication = await VolunteerApplication.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingApplication) {
      return res.status(400).json({
        message:
          existingApplication.status === 'pending'
            ? 'You already have a pending volunteer application.'
            : 'You are already approved as a volunteer.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    const application = await VolunteerApplication.create({
      user: req.user._id,
      name: user.name,
      phone: user.phone,
      district: district.trim(),
      note: note ? note.trim() : '',
      photo: getFileUrl(req, req.files.photo[0].filename),
      nidFront: getFileUrl(req, req.files.nidFront[0].filename),
      nidBack: getFileUrl(req, req.files.nidBack[0].filename),
      status: 'pending',
    });

    user.volunteerStatus = 'pending';
    user.isVolunteer = false;
    user.district = district.trim();

    await user.save();

    res.status(201).json({
      message: 'Volunteer application submitted successfully. Waiting for admin approval.',
      application,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        district: user.district,
        address: user.address,
        profilePhoto: user.profilePhoto,
        bloodGroup: user.bloodGroup,
        isBloodDonor: user.isBloodDonor,
        totalBloodDonations: user.totalBloodDonations || 0,
        lastBloodDonationDate: user.lastBloodDonationDate || null,
        nextEligibleDate: user.nextEligibleDate || null,
        isBloodDonorVerified: user.isBloodDonorVerified || false,
        isVolunteer: user.isVolunteer,
        volunteerStatus: user.volunteerStatus,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Volunteer application failed.',
      error: error.message,
    });
  }
});

// Logged-in user can see own volunteer application
router.get('/my-application', protect, async (req, res) => {
  try {
    const application = await VolunteerApplication.findOne({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get volunteer application.',
      error: error.message,
    });
  }
});

// Admin can see all volunteer applications
router.get('/admin/applications', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const applications = await VolunteerApplication.find(filter)
      .populate('user', 'name phone email district address profilePhoto role isVolunteer volunteerStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: applications.length,
      applications,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get volunteer applications.',
      error: error.message,
    });
  }
});

// Admin approve volunteer application
router.put('/admin/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const application = await VolunteerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: 'Volunteer application not found.',
      });
    }

    if (application.status === 'approved') {
      return res.status(400).json({
        message: 'This volunteer application is already approved.',
      });
    }

    if (application.status === 'rejected') {
      return res.status(400).json({
        message: 'Rejected application cannot be approved again.',
      });
    }

    const user = await User.findById(application.user);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    application.status = 'approved';
    application.adminNote = adminNote ? adminNote.trim() : '';
    application.approvedAt = new Date();
    application.rejectedAt = null;

    user.isVolunteer = true;
    user.volunteerStatus = 'approved';
    user.district = application.district;

    await application.save();
    await user.save();

    res.status(200).json({
      message: 'Volunteer application approved successfully.',
      application,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        district: user.district,
        address: user.address,
        profilePhoto: user.profilePhoto,
        role: user.role,
        isVolunteer: user.isVolunteer,
        volunteerStatus: user.volunteerStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Volunteer approval failed.',
      error: error.message,
    });
  }
});

// Admin reject volunteer application
router.put('/admin/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const application = await VolunteerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: 'Volunteer application not found.',
      });
    }

    if (application.status === 'approved') {
      return res.status(400).json({
        message: 'Approved application cannot be rejected.',
      });
    }

    if (application.status === 'rejected') {
      return res.status(400).json({
        message: 'This volunteer application is already rejected.',
      });
    }

    const user = await User.findById(application.user);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    application.status = 'rejected';
    application.adminNote = adminNote ? adminNote.trim() : '';
    application.rejectedAt = new Date();
    application.approvedAt = null;

    user.isVolunteer = false;
    user.volunteerStatus = 'rejected';

    await application.save();
    await user.save();

    res.status(200).json({
      message: 'Volunteer application rejected successfully.',
      application,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        district: user.district,
        address: user.address,
        profilePhoto: user.profilePhoto,
        role: user.role,
        isVolunteer: user.isVolunteer,
        volunteerStatus: user.volunteerStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Volunteer rejection failed.',
      error: error.message,
    });
  }
});

module.exports = router;