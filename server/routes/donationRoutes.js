const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Donation = require('../models/Donation');
const Project = require('../models/Project');
const FundCategory = require('../models/FundCategory');
const protect = require('../middlewares/authMiddleware');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Admin access required.',
  });
};

const donationUploadDir = path.join(__dirname, '..', 'uploads', 'donations');

if (!fs.existsSync(donationUploadDir)) {
  fs.mkdirSync(donationUploadDir, { recursive: true });
}

const donationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, donationUploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const safeName =
      'donation-' +
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, safeName);
  },
});

const donationFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed.'), false);
  }

  cb(null, true);
};

const uploadDonationProof = multer({
  storage: donationStorage,
  fileFilter: donationFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
}).single('proofImage');

const handleDonationProofUpload = (req, res, next) => {
  uploadDonationProof(req, res, (error) => {
    if (error) {
      let message = error.message || 'Donation proof upload failed.';

      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'Donation proof image is too large. Maximum allowed size is 10 MB.';
      }

      return res.status(400).json({
        message,
      });
    }

    next();
  });
};

const getDonationProofUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/donations/${filename}`;
};

const deleteOldDonationProof = (proofImageUrl) => {
  try {
    if (!proofImageUrl) return;

    const filename = path.basename(proofImageUrl);
    const filePath = path.join(donationUploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log('Old donation proof delete failed:', error.message);
  }
};

const allowedPaymentMethods = ['cash', 'bkash', 'nagad', 'rocket', 'bank', 'card', 'other'];
const allowedStatuses = ['pending', 'verified', 'rejected'];

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(String(value || ''));
};

const escapeRegex = (value) => {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getProjectSnapshot = async (projectId) => {
  if (!projectId || !isValidObjectId(projectId)) {
    return {
      project: null,
      projectTitle: '',
    };
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return {
      project: null,
      projectTitle: '',
    };
  }

  return {
    project: project._id,
    projectTitle: project.title,
  };
};

const getCategorySnapshot = async (categoryId, categoryName) => {
  if (categoryId && isValidObjectId(categoryId)) {
    try {
      const category = await FundCategory.findById(categoryId);

      if (category) {
        return {
          fundCategory: category._id,
          fundCategoryName: category.name || category.title || categoryName || 'General Donation',
        };
      }
    } catch (error) {
      console.log('Category lookup failed:', error.message);
    }
  }

  return {
    fundCategory: null,
    fundCategoryName: categoryName ? categoryName.trim() : 'General Donation',
  };
};

const updateProjectCollectedAmount = async (projectId, amountChange) => {
  if (!projectId || !isValidObjectId(projectId) || !amountChange) return;

  const project = await Project.findById(projectId);

  if (!project) return;

  const currentCollected = Number(project.collectedAmount || 0);
  const nextCollected = Math.max(currentCollected + Number(amountChange || 0), 0);

  project.collectedAmount = nextCollected;

  if (Number(project.targetAmount || 0) > 0 && nextCollected >= Number(project.targetAmount || 0)) {
    project.status = 'completed';
  }

  await project.save();
};

const getVerifiedProjectContribution = (donation) => {
  if (!donation || donation.status !== 'verified' || !donation.project) {
    return {
      projectId: null,
      amount: 0,
    };
  }

  return {
    projectId: donation.project,
    amount: Number(donation.amount || 0),
  };
};

const formatDonation = (donation) => {
  const item = donation.toObject ? donation.toObject() : donation;

  return {
    ...item,
    amount: Number(item.amount || 0),
  };
};

const buildDonationFilter = (query) => {
  const {
    search,
    status,
    project,
    fundCategory,
    paymentMethod,
    dateFrom,
    dateTo,
  } = query;

  const filter = {};

  if (status && allowedStatuses.includes(status)) {
    filter.status = status;
  }

  if (project && isValidObjectId(project)) {
    filter.project = project;
  }

  if (fundCategory && isValidObjectId(fundCategory)) {
    filter.fundCategory = fundCategory;
  }

  if (paymentMethod && allowedPaymentMethods.includes(paymentMethod)) {
    filter.paymentMethod = paymentMethod;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};

    if (dateFrom) {
      filter.createdAt.$gte = new Date(dateFrom);
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');

    filter.$or = [
      { donorName: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { transactionId: searchRegex },
      { projectTitle: searchRegex },
      { fundCategoryName: searchRegex },
      { note: searchRegex },
    ];
  }

  return filter;
};

const createDonationRequest = async (req, res, forceAdmin = false) => {
  try {
    const {
      project,
      fundCategory,
      fundCategoryName,
      donorName,
      phone,
      email,
      amount,
      paymentMethod,
      transactionId,
      note,
      status,
      adminNote,
      isAnonymous,
    } = req.body;

    if (!donorName || !phone || amount === undefined || amount === '') {
      return res.status(400).json({
        message: 'Donor name, phone and amount are required.',
      });
    }

    const cleanAmount = Number(amount);

    if (Number.isNaN(cleanAmount) || cleanAmount <= 0) {
      return res.status(400).json({
        message: 'Donation amount must be a valid positive number.',
      });
    }

    const cleanPaymentMethod = allowedPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : 'bkash';

    const projectSnapshot = await getProjectSnapshot(project);
    const categorySnapshot = await getCategorySnapshot(fundCategory, fundCategoryName);

    const donationStatus = forceAdmin && allowedStatuses.includes(status) ? status : 'pending';

    const proofImage = req.file ? getDonationProofUrl(req, req.file.filename) : '';

    const donation = await Donation.create({
      project: projectSnapshot.project,
      projectTitle: projectSnapshot.projectTitle,
      fundCategory: categorySnapshot.fundCategory,
      fundCategoryName: categorySnapshot.fundCategoryName,
      donorName: donorName.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : '',
      amount: cleanAmount,
      paymentMethod: cleanPaymentMethod,
      transactionId: transactionId ? transactionId.trim() : '',
      proofImage,
      note: note ? note.trim() : '',
      status: donationStatus,
      adminNote: adminNote ? adminNote.trim() : '',
      verifiedAt: donationStatus === 'verified' ? new Date() : null,
      rejectedAt: donationStatus === 'rejected' ? new Date() : null,
      verifiedBy: donationStatus === 'verified' && req.user ? req.user._id : null,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      source: forceAdmin ? 'admin' : 'website',
    });

    if (donation.status === 'verified' && donation.project) {
      await updateProjectCollectedAmount(donation.project, donation.amount);
    }

    res.status(forceAdmin ? 201 : 200).json({
      message:
        donation.status === 'verified'
          ? 'Donation added and verified successfully.'
          : 'Donation submitted successfully. It is waiting for admin verification.',
      donation: formatDonation(donation),
    });
  } catch (error) {
    console.log('Donation submit error:', error.message);

    res.status(500).json({
      message: 'Donation submit failed.',
      error: error.message,
    });
  }
};

router.post('/create', handleDonationProofUpload, async (req, res) => {
  await createDonationRequest(req, res, false);
});

router.post('/', handleDonationProofUpload, async (req, res) => {
  await createDonationRequest(req, res, false);
});

router.get('/', async (req, res) => {
  try {
    const { project, fundCategory, limit } = req.query;

    const filter = {
      status: 'verified',
    };

    if (project && isValidObjectId(project)) {
      filter.project = project;
    }

    if (fundCategory && isValidObjectId(fundCategory)) {
      filter.fundCategory = fundCategory;
    }

    const donations = await Donation.find(filter)
      .sort({ verifiedAt: -1, createdAt: -1 })
      .limit(Number(limit || 50));

    res.status(200).json({
      total: donations.length,
      donations: donations.map(formatDonation),
    });
  } catch (error) {
    console.log('Public donations error:', error.message);

    res.status(500).json({
      message: 'Failed to get donations.',
      error: error.message,
    });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'verified' })
      .sort({ verifiedAt: -1, createdAt: -1 })
      .limit(10);

    res.status(200).json({
      total: donations.length,
      donations: donations.map(formatDonation),
    });
  } catch (error) {
    console.log('Recent donations error:', error.message);

    res.status(500).json({
      message: 'Failed to get recent donations.',
      error: error.message,
    });
  }
});

router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const filter = buildDonationFilter(req.query);

    const donations = await Donation.find(filter)
      .sort({ createdAt: -1 })
      .limit(500);

    const summary = {
      total: donations.length,
      pending: donations.filter((item) => item.status === 'pending').length,
      verified: donations.filter((item) => item.status === 'verified').length,
      rejected: donations.filter((item) => item.status === 'rejected').length,
      verifiedAmount: donations
        .filter((item) => item.status === 'verified')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      pendingAmount: donations
        .filter((item) => item.status === 'pending')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };

    res.status(200).json({
      total: donations.length,
      summary,
      donations: donations.map(formatDonation),
    });
  } catch (error) {
    console.log('Admin donations error:', error.message);

    res.status(500).json({
      message: error.message || 'Failed to get admin donations.',
      error: error.message,
    });
  }
});

router.get('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      });
    }

    res.status(200).json({
      donation: formatDonation(donation),
    });
  } catch (error) {
    console.log('Single donation error:', error.message);

    res.status(500).json({
      message: 'Failed to get donation.',
      error: error.message,
    });
  }
});

router.post('/admin/create', protect, adminOnly, handleDonationProofUpload, async (req, res) => {
  await createDonationRequest(req, res, true);
});

router.put('/admin/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const { adminNote } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      });
    }

    if (donation.status === 'verified') {
      return res.status(200).json({
        message: 'Donation is already verified.',
        donation: formatDonation(donation),
      });
    }

    donation.status = 'verified';
    donation.adminNote = adminNote ? adminNote.trim() : donation.adminNote;
    donation.verifiedAt = new Date();
    donation.rejectedAt = null;
    donation.verifiedBy = req.user._id;

    await donation.save();

    if (donation.project) {
      await updateProjectCollectedAmount(donation.project, donation.amount);
    }

    res.status(200).json({
      message: 'Donation verified successfully. Project fund updated.',
      donation: formatDonation(donation),
    });
  } catch (error) {
    console.log('Donation verify error:', error.message);

    res.status(500).json({
      message: 'Donation verification failed.',
      error: error.message,
    });
  }
});

router.put('/admin/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const { adminNote } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      });
    }

    const wasVerified = donation.status === 'verified';
    const oldProjectId = donation.project;
    const oldAmount = Number(donation.amount || 0);

    donation.status = 'rejected';
    donation.adminNote = adminNote ? adminNote.trim() : donation.adminNote;
    donation.rejectedAt = new Date();
    donation.verifiedAt = null;
    donation.verifiedBy = null;

    await donation.save();

    if (wasVerified && oldProjectId) {
      await updateProjectCollectedAmount(oldProjectId, -oldAmount);
    }

    res.status(200).json({
      message: 'Donation rejected successfully.',
      donation: formatDonation(donation),
    });
  } catch (error) {
    console.log('Donation reject error:', error.message);

    res.status(500).json({
      message: 'Donation rejection failed.',
      error: error.message,
    });
  }
});

router.put('/admin/:id', protect, adminOnly, handleDonationProofUpload, async (req, res) => {
  try {
    const {
      project,
      fundCategory,
      fundCategoryName,
      donorName,
      phone,
      email,
      amount,
      paymentMethod,
      transactionId,
      note,
      status,
      adminNote,
      isAnonymous,
      removeProofImage,
    } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      });
    }

    const beforeContribution = getVerifiedProjectContribution(donation);

    if (project !== undefined) {
      const projectSnapshot = await getProjectSnapshot(project);

      donation.project = projectSnapshot.project;
      donation.projectTitle = projectSnapshot.projectTitle;
    }

    if (fundCategory !== undefined || fundCategoryName !== undefined) {
      const categorySnapshot = await getCategorySnapshot(fundCategory, fundCategoryName);

      donation.fundCategory = categorySnapshot.fundCategory;
      donation.fundCategoryName = categorySnapshot.fundCategoryName;
    }

    if (donorName !== undefined) {
      if (!donorName.trim()) {
        return res.status(400).json({
          message: 'Donor name cannot be empty.',
        });
      }

      donation.donorName = donorName.trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return res.status(400).json({
          message: 'Phone cannot be empty.',
        });
      }

      donation.phone = phone.trim();
    }

    if (email !== undefined) {
      donation.email = email ? email.trim().toLowerCase() : '';
    }

    if (amount !== undefined && amount !== '') {
      const cleanAmount = Number(amount);

      if (Number.isNaN(cleanAmount) || cleanAmount <= 0) {
        return res.status(400).json({
          message: 'Donation amount must be a valid positive number.',
        });
      }

      donation.amount = cleanAmount;
    }

    if (paymentMethod !== undefined && allowedPaymentMethods.includes(paymentMethod)) {
      donation.paymentMethod = paymentMethod;
    }

    if (transactionId !== undefined) {
      donation.transactionId = transactionId ? transactionId.trim() : '';
    }

    if (note !== undefined) {
      donation.note = note ? note.trim() : '';
    }

    if (adminNote !== undefined) {
      donation.adminNote = adminNote ? adminNote.trim() : '';
    }

    if (isAnonymous !== undefined) {
      donation.isAnonymous = isAnonymous === 'true' || isAnonymous === true;
    }

    if (status !== undefined && allowedStatuses.includes(status)) {
      donation.status = status;

      if (status === 'verified') {
        donation.verifiedAt = donation.verifiedAt || new Date();
        donation.verifiedBy = donation.verifiedBy || req.user._id;
        donation.rejectedAt = null;
      }

      if (status === 'rejected') {
        donation.rejectedAt = donation.rejectedAt || new Date();
        donation.verifiedAt = null;
        donation.verifiedBy = null;
      }

      if (status === 'pending') {
        donation.verifiedAt = null;
        donation.rejectedAt = null;
        donation.verifiedBy = null;
      }
    }

    if (removeProofImage === 'true' || removeProofImage === true) {
      deleteOldDonationProof(donation.proofImage);
      donation.proofImage = '';
    }

    if (req.file) {
      deleteOldDonationProof(donation.proofImage);
      donation.proofImage = getDonationProofUrl(req, req.file.filename);
    }

    await donation.save();

    const afterContribution = getVerifiedProjectContribution(donation);

    const beforeProjectId = beforeContribution.projectId ? String(beforeContribution.projectId) : '';
    const afterProjectId = afterContribution.projectId ? String(afterContribution.projectId) : '';

    if (beforeProjectId && beforeProjectId === afterProjectId) {
      const amountDiff = afterContribution.amount - beforeContribution.amount;

      if (amountDiff !== 0) {
        await updateProjectCollectedAmount(afterContribution.projectId, amountDiff);
      }
    } else {
      if (beforeProjectId) {
        await updateProjectCollectedAmount(beforeContribution.projectId, -beforeContribution.amount);
      }

      if (afterProjectId) {
        await updateProjectCollectedAmount(afterContribution.projectId, afterContribution.amount);
      }
    }

    res.status(200).json({
      message: 'Donation updated successfully.',
      donation: formatDonation(donation),
    });
  } catch (error) {
    console.log('Donation update error:', error.message);

    res.status(500).json({
      message: 'Donation update failed.',
      error: error.message,
    });
  }
});

router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      });
    }

    if (donation.status === 'verified' && donation.project) {
      await updateProjectCollectedAmount(donation.project, -Number(donation.amount || 0));
    }

    deleteOldDonationProof(donation.proofImage);

    await Donation.deleteOne({ _id: donation._id });

    res.status(200).json({
      message: 'Donation deleted successfully.',
    });
  } catch (error) {
    console.log('Donation delete error:', error.message);

    res.status(500).json({
      message: 'Donation delete failed.',
      error: error.message,
    });
  }
});

module.exports = router;