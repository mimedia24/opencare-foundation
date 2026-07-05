const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

const projectUploadDir = path.join(__dirname, '..', 'uploads', 'projects');

if (!fs.existsSync(projectUploadDir)) {
  fs.mkdirSync(projectUploadDir, { recursive: true });
}

const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectUploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const safeName =
      'project-' +
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, safeName);
  },
});

const projectFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed.'), false);
  }

  cb(null, true);
};

const uploadProjectImage = multer({
  storage: projectStorage,
  fileFilter: projectFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
}).single('coverImage');

const handleProjectImageUpload = (req, res, next) => {
  uploadProjectImage(req, res, (error) => {
    if (error) {
      let message = error.message || 'Project image upload failed.';

      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'Project image is too large. Maximum allowed size is 10 MB.';
      }

      return res.status(400).json({
        message,
      });
    }

    next();
  });
};

const getProjectImageUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/projects/${filename}`;
};

const deleteOldProjectImage = (imageUrl) => {
  try {
    if (!imageUrl) return;

    const filename = path.basename(imageUrl);
    const filePath = path.join(projectUploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log('Old project image delete failed:', error.message);
  }
};

const makeSlug = (title) => {
  return String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const createUniqueSlug = async (title, ignoreProjectId = null) => {
  const baseSlug = makeSlug(title) || `project-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };

    if (ignoreProjectId) {
      query._id = { $ne: ignoreProjectId };
    }

    const existingProject = await Project.findOne(query);

    if (!existingProject) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

const escapeRegex = (value) => {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const formatProject = (project) => {
  const item = project.toObject ? project.toObject({ virtuals: true }) : project;

  return {
    ...item,
    remainingAmount: Math.max(Number(item.targetAmount || 0) - Number(item.collectedAmount || 0), 0),
    progressPercent:
      Number(item.targetAmount || 0) > 0
        ? Math.min(Math.round((Number(item.collectedAmount || 0) / Number(item.targetAmount || 0)) * 100), 100)
        : 0,
  };
};

// Public project list
router.get('/', async (req, res) => {
  try {
    const { status, category, search, featured } = req.query;

    const filter = {};

    if (status && ['active', 'paused', 'completed'].includes(status)) {
      filter.status = status;
    }

    if (category) {
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');

      filter.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
      ];
    }

    const projects = await Project.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .limit(100);

    res.status(200).json({
      total: projects.length,
      projects: projects.map(formatProject),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get projects.',
      error: error.message,
    });
  }
});

// Admin project list
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { status, category, search } = req.query;

    const filter = {};

    if (status && ['active', 'paused', 'completed'].includes(status)) {
      filter.status = status;
    }

    if (category) {
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');

      filter.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
      ];
    }

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email phone role')
      .sort({ createdAt: -1 })
      .limit(500);

    res.status(200).json({
      total: projects.length,
      projects: projects.map(formatProject),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get admin projects.',
      error: error.message,
    });
  }
});

// Public single project
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    const project = await Project.findOne(query);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    res.status(200).json({
      project: formatProject(project),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get project.',
      error: error.message,
    });
  }
});

// Admin create project
router.post('/admin/create', protect, adminOnly, handleProjectImageUpload, async (req, res) => {
  try {
    const {
      title,
      category,
      targetAmount,
      collectedAmount,
      description,
      shortDescription,
      location,
      status,
      featured,
      startDate,
      endDate,
    } = req.body;

    if (!title || targetAmount === undefined || targetAmount === '') {
      return res.status(400).json({
        message: 'Project title and target amount are required.',
      });
    }

    const cleanTitle = title.trim();
    const cleanTargetAmount = Number(targetAmount);
    const cleanCollectedAmount = Number(collectedAmount || 0);

    if (Number.isNaN(cleanTargetAmount) || cleanTargetAmount < 0) {
      return res.status(400).json({
        message: 'Target amount must be a valid positive number.',
      });
    }

    if (Number.isNaN(cleanCollectedAmount) || cleanCollectedAmount < 0) {
      return res.status(400).json({
        message: 'Collected amount must be a valid positive number.',
      });
    }

    const slug = await createUniqueSlug(cleanTitle);

    const coverImage = req.file ? getProjectImageUrl(req, req.file.filename) : '';

    const project = await Project.create({
      title: cleanTitle,
      slug,
      category: category ? category.trim() : 'General',
      targetAmount: cleanTargetAmount,
      collectedAmount: cleanCollectedAmount,
      description: description ? description.trim() : '',
      shortDescription: shortDescription ? shortDescription.trim() : '',
      coverImage,
      location: location ? location.trim() : '',
      status: ['active', 'paused', 'completed'].includes(status) ? status : 'active',
      featured: featured === 'true' || featured === true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Project created successfully.',
      project: formatProject(project),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Project creation failed.',
      error: error.message,
    });
  }
});

// Admin update project
router.put('/admin/:id', protect, adminOnly, handleProjectImageUpload, async (req, res) => {
  try {
    const {
      title,
      category,
      targetAmount,
      collectedAmount,
      description,
      shortDescription,
      location,
      status,
      featured,
      startDate,
      endDate,
      removeCoverImage,
    } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    if (title !== undefined) {
      const cleanTitle = title.trim();

      if (!cleanTitle) {
        return res.status(400).json({
          message: 'Project title cannot be empty.',
        });
      }

      project.title = cleanTitle;
      project.slug = await createUniqueSlug(cleanTitle, project._id);
    }

    if (category !== undefined) {
      project.category = category ? category.trim() : 'General';
    }

    if (targetAmount !== undefined && targetAmount !== '') {
      const cleanTargetAmount = Number(targetAmount);

      if (Number.isNaN(cleanTargetAmount) || cleanTargetAmount < 0) {
        return res.status(400).json({
          message: 'Target amount must be a valid positive number.',
        });
      }

      project.targetAmount = cleanTargetAmount;
    }

    if (collectedAmount !== undefined && collectedAmount !== '') {
      const cleanCollectedAmount = Number(collectedAmount);

      if (Number.isNaN(cleanCollectedAmount) || cleanCollectedAmount < 0) {
        return res.status(400).json({
          message: 'Collected amount must be a valid positive number.',
        });
      }

      project.collectedAmount = cleanCollectedAmount;
    }

    if (description !== undefined) {
      project.description = description ? description.trim() : '';
    }

    if (shortDescription !== undefined) {
      project.shortDescription = shortDescription ? shortDescription.trim() : '';
    }

    if (location !== undefined) {
      project.location = location ? location.trim() : '';
    }

    if (status !== undefined && ['active', 'paused', 'completed'].includes(status)) {
      project.status = status;
    }

    if (featured !== undefined) {
      project.featured = featured === 'true' || featured === true;
    }

    if (startDate !== undefined) {
      project.startDate = startDate ? new Date(startDate) : null;
    }

    if (endDate !== undefined) {
      project.endDate = endDate ? new Date(endDate) : null;
    }

    if (removeCoverImage === 'true' || removeCoverImage === true) {
      deleteOldProjectImage(project.coverImage);
      project.coverImage = '';
    }

    if (req.file) {
      deleteOldProjectImage(project.coverImage);
      project.coverImage = getProjectImageUrl(req, req.file.filename);
    }

    await project.save();

    res.status(200).json({
      message: 'Project updated successfully.',
      project: formatProject(project),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Project update failed.',
      error: error.message,
    });
  }
});

// Admin update project status
router.put('/admin/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid project status.',
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    project.status = status;

    await project.save();

    res.status(200).json({
      message: 'Project status updated successfully.',
      project: formatProject(project),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Project status update failed.',
      error: error.message,
    });
  }
});

// Admin update collected amount manually
router.put('/admin/:id/collected', protect, adminOnly, async (req, res) => {
  try {
    const { collectedAmount } = req.body;

    const cleanCollectedAmount = Number(collectedAmount);

    if (Number.isNaN(cleanCollectedAmount) || cleanCollectedAmount < 0) {
      return res.status(400).json({
        message: 'Collected amount must be a valid positive number.',
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    project.collectedAmount = cleanCollectedAmount;

    await project.save();

    res.status(200).json({
      message: 'Project collected amount updated successfully.',
      project: formatProject(project),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Collected amount update failed.',
      error: error.message,
    });
  }
});

// Admin delete project
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.',
      });
    }

    deleteOldProjectImage(project.coverImage);

    await Project.deleteOne({ _id: project._id });

    res.status(200).json({
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Project delete failed.',
      error: error.message,
    });
  }
});

module.exports = router;