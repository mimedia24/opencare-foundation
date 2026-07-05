const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Please login first.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'open-care-foundation-secret-key'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'User not found. Please login again.',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: user.banReason
          ? `Your account has been banned. Reason: ${user.banReason}`
          : 'Your account has been banned.',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized. Please login again.',
      error: error.message,
    });
  }
};

module.exports = protect;