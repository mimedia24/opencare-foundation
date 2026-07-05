const express = require('express');
const mongoose = require('mongoose');

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

const makeSlug = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const createUniqueSlug = async (name, excludeId = null) => {
  const baseSlug = makeSlug(name) || `category-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await FundCategory.findOne(query);

    if (!exists) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(String(value || ''));
};

const escapeRegex = (value) => {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const formatCategory = (category) => {
  const item = category.toObject ? category.toObject() : category;

  return {
    ...item,
    sortOrder: Number(item.sortOrder || 0),
  };
};

const seedDefaultCategories = async (req, res) => {
  try {
    const defaultCategories = [
      {
        name: 'General Donation',
        description: 'General donation fund for foundation activities.',
        sortOrder: 1,
      },
      {
        name: 'Zakat',
        description: 'Zakat collection and distribution fund.',
        sortOrder: 2,
      },
      {
        name: 'Medical Support',
        description: 'Medical treatment and emergency health support fund.',
        sortOrder: 3,
      },
      {
        name: 'Education',
        description: 'Education support, scholarship and student aid fund.',
        sortOrder: 4,
      },
      {
        name: 'Food Support',
        description: 'Food distribution and hunger relief fund.',
        sortOrder: 5,
      },
      {
        name: 'Emergency Relief',
        description: 'Emergency relief and disaster response fund.',
        sortOrder: 6,
      },
      {
        name: 'Mosque Construction',
        description: 'Mosque construction and renovation project fund.',
        sortOrder: 7,
      },
      {
        name: 'Orphan Support',
        description: 'Support fund for orphans and vulnerable children.',
        sortOrder: 8,
      },
    ];

    const created = [];

    for (const item of defaultCategories) {
      const existing = await FundCategory.findOne({
        name: new RegExp(`^${escapeRegex(item.name)}$`, 'i'),
      });

      if (!existing) {
        const category = await FundCategory.create({
          name: item.name,
          slug: await createUniqueSlug(item.name),
          description: item.description,
          status: 'active',
          sortOrder: item.sortOrder,
          createdBy: req.user?._id || null,
        });

        created.push(category);
      }
    }

    res.status(200).json({
      message:
        created.length > 0
          ? 'Default categories created successfully.'
          : 'Default categories already exist.',
      created: created.map(formatCategory),
    });
  } catch (error) {
    console.log('Seed categories error:', error.message);

    res.status(500).json({
      message: 'Default category creation failed.',
      error: error.message,
    });
  }
};

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');

      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { description: searchRegex },
      ];
    }

    const categories = await FundCategory.find(filter).sort({
      sortOrder: 1,
      name: 1,
    });

    res.status(200).json({
      total: categories.length,
      categories: categories.map(formatCategory),
    });
  } catch (error) {
    console.log('Public categories error:', error.message);

    res.status(500).json({
      message: 'Failed to get categories.',
      error: error.message,
    });
  }
});

router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');

      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { description: searchRegex },
      ];
    }

    const categories = await FundCategory.find(filter)
      .populate('createdBy', 'name email phone role')
      .sort({ sortOrder: 1, name: 1 });

    const summary = {
      total: categories.length,
      active: categories.filter((item) => item.status === 'active').length,
      inactive: categories.filter((item) => item.status === 'inactive').length,
    };

    res.status(200).json({
      total: categories.length,
      summary,
      categories: categories.map(formatCategory),
    });
  } catch (error) {
    console.log('Admin categories error:', error.message);

    res.status(500).json({
      message: 'Failed to get admin categories.',
      error: error.message,
    });
  }
});

router.post('/admin/seed', protect, adminOnly, seedDefaultCategories);

router.post('/admin/create', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, status, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Category name is required.',
      });
    }

    const exists = await FundCategory.findOne({
      name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
    });

    if (exists) {
      return res.status(400).json({
        message: 'This category already exists.',
      });
    }

    const category = await FundCategory.create({
      name: name.trim(),
      slug: await createUniqueSlug(name),
      description: description ? description.trim() : '',
      status: ['active', 'inactive'].includes(status) ? status : 'active',
      sortOrder: Number(sortOrder || 0),
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Category created successfully.',
      category: formatCategory(category),
    });
  } catch (error) {
    console.log('Category create error:', error.message);

    res.status(500).json({
      message: 'Category creation failed.',
      error: error.message,
    });
  }
});

router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, status, sortOrder } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid category id.',
      });
    }

    const category = await FundCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: 'Category not found.',
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: 'Category name cannot be empty.',
        });
      }

      const exists = await FundCategory.findOne({
        _id: { $ne: category._id },
        name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
      });

      if (exists) {
        return res.status(400).json({
          message: 'This category already exists.',
        });
      }

      category.name = name.trim();
      category.slug = await createUniqueSlug(name, category._id);
    }

    if (description !== undefined) {
      category.description = description ? description.trim() : '';
    }

    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      category.status = status;
    }

    if (sortOrder !== undefined) {
      category.sortOrder = Number(sortOrder || 0);
    }

    await category.save();

    res.status(200).json({
      message: 'Category updated successfully.',
      category: formatCategory(category),
    });
  } catch (error) {
    console.log('Category update error:', error.message);

    res.status(500).json({
      message: 'Category update failed.',
      error: error.message,
    });
  }
});

router.put('/admin/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid category id.',
      });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid category status.',
      });
    }

    const category = await FundCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: 'Category not found.',
      });
    }

    category.status = status;

    await category.save();

    res.status(200).json({
      message: 'Category status updated successfully.',
      category: formatCategory(category),
    });
  } catch (error) {
    console.log('Category status error:', error.message);

    res.status(500).json({
      message: 'Category status update failed.',
      error: error.message,
    });
  }
});

router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid category id.',
      });
    }

    const category = await FundCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: 'Category not found.',
      });
    }

    await FundCategory.deleteOne({ _id: category._id });

    res.status(200).json({
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    console.log('Category delete error:', error.message);

    res.status(500).json({
      message: 'Category delete failed.',
      error: error.message,
    });
  }
});

module.exports = router;