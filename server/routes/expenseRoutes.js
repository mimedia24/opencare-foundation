const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Expense = require('../models/Expense');
const Project = require('../models/Project');
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

const expenseUploadDir = path.join(__dirname, '..', 'uploads', 'expenses');

if (!fs.existsSync(expenseUploadDir)) {
  fs.mkdirSync(expenseUploadDir, { recursive: true });
}

const expenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, expenseUploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const safeName =
      'expense-' +
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, safeName);
  },
});

const expenseFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed.'), false);
  }

  cb(null, true);
};

const uploadExpenseProof = multer({
  storage: expenseStorage,
  fileFilter: expenseFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
}).single('proofImage');

const handleExpenseProofUpload = (req, res, next) => {
  uploadExpenseProof(req, res, (error) => {
    if (error) {
      let message = error.message || 'Expense proof upload failed.';

      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'Expense proof image is too large. Maximum allowed size is 10 MB.';
      }

      return res.status(400).json({
        message,
      });
    }

    next();
  });
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(String(value || ''));
};

const escapeRegex = (value) => {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getExpenseProofUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/expenses/${filename}`;
};

const deleteOldExpenseProof = (proofImageUrl) => {
  try {
    if (!proofImageUrl) return;

    const filename = path.basename(proofImageUrl);
    const filePath = path.join(expenseUploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log('Old expense proof delete failed:', error.message);
  }
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

const formatExpense = (expense) => {
  const item = expense.toObject ? expense.toObject() : expense;

  return {
    ...item,
    amount: Number(item.amount || 0),
  };
};

const buildExpenseFilter = (query, publicOnly = false) => {
  const { search, status, project, category, dateFrom, dateTo } = query;

  const filter = {};

  if (publicOnly) {
    filter.status = 'published';
  } else if (status && ['published', 'draft', 'hidden'].includes(status)) {
    filter.status = status;
  }

  if (project && isValidObjectId(project)) {
    filter.project = project;
  }

  if (category) {
    filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
  }

  if (dateFrom || dateTo) {
    filter.expenseDate = {};

    if (dateFrom) {
      filter.expenseDate.$gte = new Date(dateFrom);
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filter.expenseDate.$lte = endDate;
    }
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');

    filter.$or = [
      { title: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
      { projectTitle: searchRegex },
      { proofLink: searchRegex },
    ];
  }

  return filter;
};

// Public transparency expense list
router.get('/', async (req, res) => {
  try {
    const filter = buildExpenseFilter(req.query, true);

    const expenses = await Expense.find(filter)
      .populate('project', 'title slug status coverImage')
      .sort({ expenseDate: -1, createdAt: -1 })
      .limit(Number(req.query.limit || 100));

    const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.status(200).json({
      total: expenses.length,
      totalAmount,
      expenses: expenses.map(formatExpense),
    });
  } catch (error) {
    console.log('Public expenses error:', error.message);

    res.status(500).json({
      message: 'Failed to get expenses.',
      error: error.message,
    });
  }
});

// Admin expense list
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const filter = buildExpenseFilter(req.query, false);

    const expenses = await Expense.find(filter)
      .populate('project', 'title slug status coverImage')
      .populate('createdBy', 'name email phone role')
      .sort({ expenseDate: -1, createdAt: -1 })
      .limit(500);

    const summary = {
      total: expenses.length,
      published: expenses.filter((item) => item.status === 'published').length,
      draft: expenses.filter((item) => item.status === 'draft').length,
      hidden: expenses.filter((item) => item.status === 'hidden').length,
      totalAmount: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      publishedAmount: expenses
        .filter((item) => item.status === 'published')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };

    res.status(200).json({
      total: expenses.length,
      summary,
      expenses: expenses.map(formatExpense),
    });
  } catch (error) {
    console.log('Admin expenses error:', error.message);

    res.status(500).json({
      message: 'Failed to get admin expenses.',
      error: error.message,
    });
  }
});

// Admin single expense
router.get('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid expense id.',
      });
    }

    const expense = await Expense.findById(req.params.id)
      .populate('project', 'title slug status coverImage')
      .populate('createdBy', 'name email phone role');

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found.',
      });
    }

    res.status(200).json({
      expense: formatExpense(expense),
    });
  } catch (error) {
    console.log('Single expense error:', error.message);

    res.status(500).json({
      message: 'Failed to get expense.',
      error: error.message,
    });
  }
});

// Admin create expense
router.post('/admin/create', protect, adminOnly, handleExpenseProofUpload, async (req, res) => {
  try {
    const {
      project,
      category,
      title,
      amount,
      description,
      expenseDate,
      proofLink,
      status,
    } = req.body;

    if (!title || amount === undefined || amount === '') {
      return res.status(400).json({
        message: 'Expense title and amount are required.',
      });
    }

    const cleanAmount = Number(amount);

    if (Number.isNaN(cleanAmount) || cleanAmount <= 0) {
      return res.status(400).json({
        message: 'Expense amount must be a valid positive number.',
      });
    }

    const projectSnapshot = await getProjectSnapshot(project);
    const proofImage = req.file ? getExpenseProofUrl(req, req.file.filename) : '';

    const expense = await Expense.create({
      project: projectSnapshot.project,
      projectTitle: projectSnapshot.projectTitle,
      category: category ? category.trim() : 'General Expense',
      title: title.trim(),
      amount: cleanAmount,
      description: description ? description.trim() : '',
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      proofImage,
      proofLink: proofLink ? proofLink.trim() : '',
      status: ['published', 'draft', 'hidden'].includes(status) ? status : 'published',
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Expense created successfully.',
      expense: formatExpense(expense),
    });
  } catch (error) {
    console.log('Expense create error:', error.message);

    res.status(500).json({
      message: 'Expense creation failed.',
      error: error.message,
    });
  }
});

// Admin update expense
router.put('/admin/:id', protect, adminOnly, handleExpenseProofUpload, async (req, res) => {
  try {
    const {
      project,
      category,
      title,
      amount,
      description,
      expenseDate,
      proofLink,
      status,
      removeProofImage,
    } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid expense id.',
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found.',
      });
    }

    if (project !== undefined) {
      const projectSnapshot = await getProjectSnapshot(project);

      expense.project = projectSnapshot.project;
      expense.projectTitle = projectSnapshot.projectTitle;
    }

    if (category !== undefined) {
      expense.category = category ? category.trim() : 'General Expense';
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          message: 'Expense title cannot be empty.',
        });
      }

      expense.title = title.trim();
    }

    if (amount !== undefined && amount !== '') {
      const cleanAmount = Number(amount);

      if (Number.isNaN(cleanAmount) || cleanAmount <= 0) {
        return res.status(400).json({
          message: 'Expense amount must be a valid positive number.',
        });
      }

      expense.amount = cleanAmount;
    }

    if (description !== undefined) {
      expense.description = description ? description.trim() : '';
    }

    if (expenseDate !== undefined) {
      expense.expenseDate = expenseDate ? new Date(expenseDate) : new Date();
    }

    if (proofLink !== undefined) {
      expense.proofLink = proofLink ? proofLink.trim() : '';
    }

    if (status !== undefined && ['published', 'draft', 'hidden'].includes(status)) {
      expense.status = status;
    }

    if (removeProofImage === 'true' || removeProofImage === true) {
      deleteOldExpenseProof(expense.proofImage);
      expense.proofImage = '';
    }

    if (req.file) {
      deleteOldExpenseProof(expense.proofImage);
      expense.proofImage = getExpenseProofUrl(req, req.file.filename);
    }

    await expense.save();

    res.status(200).json({
      message: 'Expense updated successfully.',
      expense: formatExpense(expense),
    });
  } catch (error) {
    console.log('Expense update error:', error.message);

    res.status(500).json({
      message: 'Expense update failed.',
      error: error.message,
    });
  }
});

// Admin update expense status
router.put('/admin/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid expense id.',
      });
    }

    if (!['published', 'draft', 'hidden'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid expense status.',
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found.',
      });
    }

    expense.status = status;

    await expense.save();

    res.status(200).json({
      message: 'Expense status updated successfully.',
      expense: formatExpense(expense),
    });
  } catch (error) {
    console.log('Expense status error:', error.message);

    res.status(500).json({
      message: 'Expense status update failed.',
      error: error.message,
    });
  }
});

// Admin delete expense
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid expense id.',
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found.',
      });
    }

    deleteOldExpenseProof(expense.proofImage);

    await Expense.deleteOne({ _id: expense._id });

    res.status(200).json({
      message: 'Expense deleted successfully.',
    });
  } catch (error) {
    console.log('Expense delete error:', error.message);

    res.status(500).json({
      message: 'Expense delete failed.',
      error: error.message,
    });
  }
});

module.exports = router;