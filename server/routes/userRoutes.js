const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const BloodDonationRequest = require('../models/BloodDonationRequest');
const VolunteerApplication = require('../models/VolunteerApplication');
const protect = require('../middlewares/authMiddleware');
const { sendSms } = require('../utils/sendSms');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'open-care-foundation-secret-key';

const OTP_EXPIRE_MINUTES = Number(process.env.OTP_EXPIRE_MINUTES) || 5;
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS) || 30;

const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

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

const restoreBloodDonationStats = async (user) => {
  const approvedRequests = await BloodDonationRequest.find({
    user: user._id,
    status: 'approved',
  }).sort({
    donationDate: -1,
    approvedAt: -1,
    createdAt: -1,
  });

  if (approvedRequests.length === 0) {
    user.totalBloodDonations = Number(user.totalBloodDonations || 0);
    user.lastBloodDonationDate = user.lastBloodDonationDate || null;
    user.nextEligibleDate = user.nextEligibleDate || null;
    user.isBloodDonorVerified = Boolean(user.isBloodDonorVerified);
    return;
  }

  const latestRequest = approvedRequests[0];

  const latestDonationDate =
    latestRequest.donationDate || latestRequest.approvedAt || latestRequest.createdAt || new Date();

  user.bloodGroup = user.bloodGroup || latestRequest.bloodGroup;
  user.district = user.district || latestRequest.district;
  user.address = user.address || latestRequest.address;

  user.totalBloodDonations = Math.max(
    Number(user.totalBloodDonations || 0),
    approvedRequests.length
  );

  user.lastBloodDonationDate = latestDonationDate;
  user.nextEligibleDate = calculateNextEligibleDate(latestDonationDate);
  user.isBloodDonorVerified = true;
};

// Profile photo upload setup
const profileUploadDir = path.join(__dirname, '..', 'uploads', 'profiles');

if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const safeName =
      'profile-' +
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, safeName);
  },
});

const profileFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed.'), false);
  }

  cb(null, true);
};

const uploadProfilePhoto = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
}).single('profilePhoto');

const handleProfileUpload = (req, res, next) => {
  uploadProfilePhoto(req, res, (error) => {
    if (error) {
      let message = error.message || 'Profile photo upload failed.';

      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'Profile photo is too large. Maximum allowed size is 10 MB.';
      }

      return res.status(400).json({
        message,
      });
    }

    next();
  });
};

const getProfilePhotoUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/profiles/${filename}`;
};

const deleteOldProfilePhoto = (profilePhotoUrl) => {
  try {
    if (!profilePhotoUrl) return;

    const filename = path.basename(profilePhotoUrl);
    const filePath = path.join(profileUploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log('Old profile photo delete failed:', error.message);
  }
};

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const getSafeUser = (user) => ({
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

  role: user.role,
  isBanned: user.isBanned || false,
  banReason: user.banReason || '',
  bannedAt: user.bannedAt || null,
  isVolunteer: user.isVolunteer,
  volunteerStatus: user.volunteerStatus,
});

const generateOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const getSecondsLeft = (date) => {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 1000));
};

// Register request: sends OTP, does not create final user yet
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        message: 'Name, phone and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters.',
      });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    const existingPhone = await User.findOne({ phone: cleanPhone });

    if (existingPhone) {
      return res.status(400).json({
        message: 'This phone number already has an account.',
      });
    }

    if (cleanEmail) {
      const existingEmail = await User.findOne({ email: cleanEmail });

      if (existingEmail) {
        return res.status(400).json({
          message: 'This email already has an account.',
        });
      }
    }

    const existingPending = await PendingUser.findOne({ phone: cleanPhone });

    if (existingPending && existingPending.resendAvailableAt > new Date()) {
      return res.status(429).json({
        message: `Please wait ${getSecondsLeft(
          existingPending.resendAvailableAt
        )} seconds before requesting another OTP.`,
        waitSeconds: getSecondsLeft(existingPending.resendAvailableAt),
      });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + OTP_RESEND_SECONDS * 1000);
    const pendingExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PendingUser.findOneAndUpdate(
      { phone: cleanPhone },
      {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        password: hashedPassword,
        otpHash,
        otpExpiresAt,
        resendAvailableAt,
        attempts: 0,
        expiresAt: pendingExpiresAt,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const smsMessage = `Your Open Care Foundation OTP is ${otp}. It will expire in ${OTP_EXPIRE_MINUTES} minutes.`;

    const smsResult = await sendSms(cleanPhone, smsMessage);

    res.status(200).json({
      message: 'OTP sent successfully. Please verify your phone number.',
      phone: cleanPhone,
      otpExpiresInMinutes: OTP_EXPIRE_MINUTES,
      resendAfterSeconds: OTP_RESEND_SECONDS,
      smsSent: smsResult.success,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Registration OTP request failed.',
      error: error.message,
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: 'Phone number is required.',
      });
    }

    const cleanPhone = phone.trim();

    const pendingUser = await PendingUser.findOne({ phone: cleanPhone });

    if (!pendingUser) {
      return res.status(404).json({
        message: 'No pending registration found. Please register again.',
      });
    }

    if (pendingUser.resendAvailableAt > new Date()) {
      return res.status(429).json({
        message: `Please wait ${getSecondsLeft(
          pendingUser.resendAvailableAt
        )} seconds before requesting another OTP.`,
        waitSeconds: getSecondsLeft(pendingUser.resendAvailableAt),
      });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    pendingUser.otpHash = otpHash;
    pendingUser.otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    pendingUser.resendAvailableAt = new Date(Date.now() + OTP_RESEND_SECONDS * 1000);
    pendingUser.attempts = 0;
    pendingUser.expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pendingUser.save();

    const smsMessage = `Your Open Care Foundation OTP is ${otp}. It will expire in ${OTP_EXPIRE_MINUTES} minutes.`;

    const smsResult = await sendSms(cleanPhone, smsMessage);

    res.status(200).json({
      message: 'OTP resent successfully.',
      phone: cleanPhone,
      otpExpiresInMinutes: OTP_EXPIRE_MINUTES,
      resendAfterSeconds: OTP_RESEND_SECONDS,
      smsSent: smsResult.success,
    });
  } catch (error) {
    res.status(500).json({
      message: 'OTP resend failed.',
      error: error.message,
    });
  }
});

// Verify OTP and create account
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        message: 'Phone and OTP are required.',
      });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = String(otp).trim();

    const pendingUser = await PendingUser.findOne({ phone: cleanPhone });

    if (!pendingUser) {
      return res.status(404).json({
        message: 'No pending registration found. Please register again.',
      });
    }

    if (pendingUser.otpExpiresAt < new Date()) {
      return res.status(400).json({
        message: 'OTP expired. Please request a new OTP.',
      });
    }

    if (pendingUser.attempts >= 5) {
      return res.status(429).json({
        message: 'Too many wrong attempts. Please request a new OTP.',
      });
    }

    const isOtpMatched = await bcrypt.compare(cleanOtp, pendingUser.otpHash);

    if (!isOtpMatched) {
      pendingUser.attempts += 1;
      await pendingUser.save();

      return res.status(400).json({
        message: 'Invalid OTP.',
        attemptsLeft: Math.max(0, 5 - pendingUser.attempts),
      });
    }

    const existingPhone = await User.findOne({ phone: cleanPhone });

    if (existingPhone) {
      await PendingUser.deleteOne({ _id: pendingUser._id });

      return res.status(400).json({
        message: 'This phone number already has an account.',
      });
    }

    if (pendingUser.email) {
      const existingEmail = await User.findOne({ email: pendingUser.email });

      if (existingEmail) {
        await PendingUser.deleteOne({ _id: pendingUser._id });

        return res.status(400).json({
          message: 'This email already has an account.',
        });
      }
    }

    const user = await User.create({
      name: pendingUser.name,
      phone: pendingUser.phone,
      email: pendingUser.email,
      password: pendingUser.password,
    });

    await PendingUser.deleteOne({ _id: pendingUser._id });

    const token = createToken(user);

    res.status(201).json({
      message: 'Phone verified and account created successfully.',
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'OTP verification failed.',
      error: error.message,
    });
  }
});

// Login account
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Phone/email and password are required.',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ phone: cleanIdentifier }, { email: cleanIdentifier }],
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid login information.',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: user.banReason
          ? `This account has been banned. Reason: ${user.banReason}`
          : 'This account has been banned. Please contact admin.',
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      return res.status(400).json({
        message: 'Invalid login information.',
      });
    }

    const token = createToken(user);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Login failed.',
      error: error.message,
    });
  }
});

// Logged-in user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get profile.',
      error: error.message,
    });
  }
});

// Upload logged-in user profile photo
router.put('/profile-photo', protect, handleProfileUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Profile photo is required.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    deleteOldProfilePhoto(user.profilePhoto);

    user.profilePhoto = getProfilePhotoUrl(req, req.file.filename);

    await user.save();

    res.status(200).json({
      message: 'Profile photo updated successfully.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Profile photo update failed.',
      error: error.message,
    });
  }
});

// Update normal profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, district, address } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email ? email.trim().toLowerCase() : undefined;

      if (cleanEmail && cleanEmail !== user.email) {
        const existingEmail = await User.findOne({ email: cleanEmail });

        if (existingEmail) {
          return res.status(400).json({
            message: 'This email is already used by another account.',
          });
        }
      }

      user.email = cleanEmail;
    }

    if (district !== undefined) {
      user.district = district.trim();
    }

    if (address !== undefined) {
      user.address = address.trim();
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Profile update failed.',
      error: error.message,
    });
  }
});

// Become blood donor
router.put('/become-blood-donor', protect, async (req, res) => {
  try {
    const { name, phone, district, address, bloodGroup } = req.body;

    if (!name || !phone || !district || !bloodGroup) {
      return res.status(400).json({
        message: 'Name, phone, district and blood group are required.',
      });
    }

    if (!allowedBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        message: 'Invalid blood group.',
      });
    }

    const cleanPhone = phone.trim();

    const existingPhone = await User.findOne({
      phone: cleanPhone,
      _id: { $ne: req.user._id },
    });

    if (existingPhone) {
      return res.status(400).json({
        message: 'This phone number is already used by another account.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    user.name = name.trim();
    user.phone = cleanPhone;
    user.district = district.trim();
    user.address = address ? address.trim() : '';
    user.bloodGroup = bloodGroup;
    user.isBloodDonor = true;

    await restoreBloodDonationStats(user);

    await user.save();

    res.status(200).json({
      message: 'You are now added as a blood donor.',
      donor: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        district: user.district,
        address: user.address,
        profilePhoto: user.profilePhoto,
        bloodGroup: user.bloodGroup,
        isBloodDonor: user.isBloodDonor,
        totalBloodDonations: user.totalBloodDonations || 0,
        lastBloodDonationDate: user.lastBloodDonationDate || null,
        nextEligibleDate: user.nextEligibleDate || null,
        isBloodDonorVerified: user.isBloodDonorVerified || false,
      },
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to add blood donor information.',
      error: error.message,
    });
  }
});

// Remove myself from blood donor list
router.put('/remove-blood-donor', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    user.isBloodDonor = false;

    await user.save();

    res.status(200).json({
      message: 'You have been removed from blood donor list. Previous donor history is kept.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to remove blood donor information.',
      error: error.message,
    });
  }
});

// Public blood donor list
router.get('/blood-donors', async (req, res) => {
  try {
    const { district, bloodGroup } = req.query;

    const filter = {
      isBloodDonor: true,
      isBanned: { $ne: true },
    };

    if (district) {
      filter.district = new RegExp(`^${district.trim()}$`, 'i');
    }

    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }

    const donors = await User.find(filter)
      .select(
        'name phone district address profilePhoto bloodGroup totalBloodDonations lastBloodDonationDate nextEligibleDate isBloodDonorVerified updatedAt'
      )
      .sort({ updatedAt: -1 })
      .limit(100);

    res.status(200).json({
      total: donors.length,
      donors,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get blood donors.',
      error: error.message,
    });
  }
});

// Admin can see all users
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { search, role, status, bloodDonor, volunteerStatus } = req.query;

    const filter = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');

      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { district: searchRegex },
      ];
    }

    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (status === 'active') {
      filter.isBanned = { $ne: true };
    }

    if (status === 'banned') {
      filter.isBanned = true;
    }

    if (bloodDonor === 'true') {
      filter.isBloodDonor = true;
    }

    if (bloodDonor === 'false') {
      filter.isBloodDonor = false;
    }

    if (volunteerStatus && ['none', 'pending', 'approved', 'rejected'].includes(volunteerStatus)) {
      filter.volunteerStatus = volunteerStatus;
    }

    const users = await User.find(filter)
      .select(
        'name phone email district address profilePhoto role isBanned banReason bannedAt isBloodDonor bloodGroup totalBloodDonations lastBloodDonationDate nextEligibleDate isBloodDonorVerified isVolunteer volunteerStatus createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .limit(500);

    const userIds = users.map((user) => user._id);

    const approvedVolunteerApplications = await VolunteerApplication.find({
      user: { $in: userIds },
      status: 'approved',
    }).select('user');

    const approvedVolunteerUserIds = new Set(
      approvedVolunteerApplications.map((application) => String(application.user))
    );

    const usersWithHistory = users.map((user) => {
      const userObject = user.toObject();

      userObject.hasVolunteerHistory = approvedVolunteerUserIds.has(String(user._id));

      return userObject;
    });

    res.status(200).json({
      total: usersWithHistory.length,
      users: usersWithHistory,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get users.',
      error: error.message,
    });
  }
});

// Admin ban user
router.put('/admin/:id/ban', protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;

    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({
        message: 'You cannot ban your own admin account.',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    user.isBanned = true;
    user.banReason = reason ? reason.trim() : '';
    user.bannedAt = new Date();

    await user.save();

    res.status(200).json({
      message: 'User banned successfully.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'User ban failed.',
      error: error.message,
    });
  }
});

// Admin unban user
router.put('/admin/:id/unban', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    user.isBanned = false;
    user.banReason = '';
    user.bannedAt = null;

    await user.save();

    res.status(200).json({
      message: 'User unbanned successfully.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'User unban failed.',
      error: error.message,
    });
  }
});

// Admin remove user from volunteer
router.put('/admin/:id/remove-volunteer', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    user.isVolunteer = false;
    user.volunteerStatus = 'none';

    await user.save();

    res.status(200).json({
      message: 'User removed from volunteer successfully.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Remove volunteer failed.',
      error: error.message,
    });
  }
});

// Admin restore removed volunteer from approved application history
router.put('/admin/:id/restore-volunteer', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    const approvedApplication = await VolunteerApplication.findOne({
      user: user._id,
      status: 'approved',
    }).sort({
      approvedAt: -1,
      createdAt: -1,
    });

    if (!approvedApplication) {
      return res.status(400).json({
        message: 'No approved volunteer application history found for this user.',
      });
    }

    user.isVolunteer = true;
    user.volunteerStatus = 'approved';

    if (!user.district && approvedApplication.district) {
      user.district = approvedApplication.district;
    }

    await user.save();

    res.status(200).json({
      message: 'Volunteer restored successfully from previous approved application.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Restore volunteer failed.',
      error: error.message,
    });
  }
});

// Admin remove user from blood donor list but keep previous donor history
router.put('/admin/:id/remove-blood-donor', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    user.isBloodDonor = false;

    await user.save();

    res.status(200).json({
      message: 'User removed from public blood donor list. Previous donor history is kept.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Remove blood donor failed.',
      error: error.message,
    });
  }
});

// Admin restore user as blood donor with previous donor history
router.put('/admin/:id/restore-blood-donor', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    await restoreBloodDonationStats(user);

    if (!user.bloodGroup) {
      return res.status(400).json({
        message:
          'Previous blood group was not found. Please ask the user to add blood donor information again.',
      });
    }

    user.isBloodDonor = true;

    await user.save();

    res.status(200).json({
      message: 'Blood donor restored successfully with previous donor history.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to restore blood donor.',
      error: error.message,
    });
  }
});

// Admin make user admin
router.put('/admin/:id/make-admin', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    user.role = 'admin';

    await user.save();

    res.status(200).json({
      message: 'User role updated to admin successfully.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Make admin failed.',
      error: error.message,
    });
  }
});

// Admin remove admin role
router.put('/admin/:id/remove-admin', protect, adminOnly, async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({
        message: 'You cannot remove admin role from your own account.',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    user.role = 'user';

    await user.save();

    res.status(200).json({
      message: 'Admin role removed successfully.',
      user: getSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Remove admin role failed.',
      error: error.message,
    });
  }
});

module.exports = router;