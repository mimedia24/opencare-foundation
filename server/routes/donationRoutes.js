const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const Donation = require('../models/Donation')
const Project = require('../models/Project')
const FundCategory = require('../models/FundCategory')
const protect = require('../middlewares/authMiddleware')

const router = express.Router()

const uploadDir = path.join(__dirname, '..', 'uploads', 'donations')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir)
  },
  filename(req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
      file.originalname
    )}`
    cb(null, uniqueName)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG and WEBP image files are allowed.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ''))
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required.',
    })
  }

  next()
}

function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`
}

function getProofUrl(req, proofImage) {
  if (!proofImage) return ''

  if (
    String(proofImage).startsWith('http://') ||
    String(proofImage).startsWith('https://')
  ) {
    return proofImage
  }

  if (String(proofImage).startsWith('/uploads/')) {
    return `${getBaseUrl(req)}${proofImage}`
  }

  return `${getBaseUrl(req)}/uploads/donations/${proofImage}`
}

function removeProofFile(proofImage) {
  if (!proofImage) return

  const fileName = path.basename(proofImage)
  const filePath = path.join(uploadDir, fileName)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

async function findCategoryByName(name) {
  if (!name) return null

  return FundCategory.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
  })
}

async function getDefaultCategory() {
  const general =
    (await findCategoryByName('General Donation')) ||
    (await FundCategory.findOne({ status: 'active' }).sort({ sortOrder: 1, createdAt: 1 }))

  return general || null
}

async function getAllProjectCategory() {
  const allProject =
    (await findCategoryByName('All project')) ||
    (await FundCategory.findOne({
      slug: new RegExp(`^${escapeRegex('all-project')}$`, 'i'),
    }))

  if (allProject) return allProject

  return getDefaultCategory()
}

async function resolveProject(projectId) {
  if (!projectId || !isValidObjectId(projectId)) {
    return null
  }

  const project = await Project.findById(projectId)

  if (!project) return null

  return project
}

async function resolveFundCategory({ fundCategory, fundCategoryName, project }) {
  if (project) {
    const allProjectCategory = await getAllProjectCategory()

    return {
      fundCategory: allProjectCategory?._id || null,
      fundCategoryName: allProjectCategory?.name || 'All project',
    }
  }

  if (fundCategory && isValidObjectId(fundCategory)) {
    const category = await FundCategory.findById(fundCategory)

    if (category) {
      return {
        fundCategory: category._id,
        fundCategoryName: category.name,
      }
    }
  }

  if (fundCategoryName) {
    const categoryByName = await findCategoryByName(fundCategoryName)

    if (categoryByName) {
      return {
        fundCategory: categoryByName._id,
        fundCategoryName: categoryByName.name,
      }
    }

    return {
      fundCategory: null,
      fundCategoryName: String(fundCategoryName).trim() || 'General Donation',
    }
  }

  const defaultCategory = await getDefaultCategory()

  return {
    fundCategory: defaultCategory?._id || null,
    fundCategoryName: defaultCategory?.name || 'General Donation',
  }
}

function formatDonation(req, donation) {
  const item = donation.toObject ? donation.toObject() : donation

  return {
    ...item,
    proofImage: getProofUrl(req, item.proofImage),
  }
}

async function applyProjectAmount(projectId, amount) {
  if (!projectId || !isValidObjectId(projectId)) return

  await Project.findByIdAndUpdate(projectId, {
    $inc: {
      collectedAmount: Number(amount || 0),
    },
  })
}

async function reverseProjectAmount(projectId, amount) {
  if (!projectId || !isValidObjectId(projectId)) return

  const project = await Project.findById(projectId)

  if (!project) return

  project.collectedAmount = Math.max(Number(project.collectedAmount || 0) - Number(amount || 0), 0)

  await project.save()
}

async function syncVerifiedProjectAmount(oldDonation, newDonation) {
  const oldVerified = oldDonation?.status === 'verified'
  const newVerified = newDonation?.status === 'verified'

  const oldProjectId = oldDonation?.project ? String(oldDonation.project) : ''
  const newProjectId = newDonation?.project ? String(newDonation.project) : ''

  const oldAmount = Number(oldDonation?.amount || 0)
  const newAmount = Number(newDonation?.amount || 0)

  if (oldVerified && oldProjectId) {
    await reverseProjectAmount(oldProjectId, oldAmount)
  }

  if (newVerified && newProjectId) {
    await applyProjectAmount(newProjectId, newAmount)
  }
}

async function buildDonationPayload(req, sourceType = 'website') {
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
    adminNote,
    status,
    isAnonymous,
  } = req.body

  if (!donorName || !String(donorName).trim()) {
    throw new Error('Donor name is required.')
  }

  if (!phone || !String(phone).trim()) {
    throw new Error('Phone number is required.')
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error('Donation amount must be a valid positive number.')
  }

  const projectDoc = await resolveProject(project)

  const categoryInfo = await resolveFundCategory({
    fundCategory,
    fundCategoryName,
    project: projectDoc,
  })

  const proofImage = req.file ? `/uploads/donations/${req.file.filename}` : ''

  return {
    project: projectDoc?._id || null,
    projectTitle: projectDoc?.title || '',
    fundCategory: categoryInfo.fundCategory || null,
    fundCategoryName: categoryInfo.fundCategoryName || 'General Donation',
    donorName: String(donorName).trim(),
    phone: String(phone).trim(),
    email: String(email || '').trim(),
    amount: Number(amount),
    paymentMethod: paymentMethod || 'other',
    transactionId: String(transactionId || '').trim(),
    proofImage,
    note: String(note || '').trim(),
    adminNote: String(adminNote || '').trim(),
    status: sourceType === 'admin' ? status || 'pending' : 'pending',
    isAnonymous: String(isAnonymous) === 'true' || isAnonymous === true,
    source: sourceType,
  }
}

function buildDonationFilter(query = {}) {
  const filter = {}

  if (query.status && query.status !== 'all') {
    filter.status = query.status
  }

  if (query.paymentMethod && query.paymentMethod !== 'all') {
    filter.paymentMethod = query.paymentMethod
  }

  if (query.project && isValidObjectId(query.project)) {
    filter.project = query.project
  }

  if (query.category && isValidObjectId(query.category)) {
    filter.fundCategory = query.category
  }

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {}

    if (query.dateFrom) {
      filter.createdAt.$gte = new Date(`${query.dateFrom}T00:00:00.000Z`)
    }

    if (query.dateTo) {
      filter.createdAt.$lte = new Date(`${query.dateTo}T23:59:59.999Z`)
    }
  }

  if (query.search && String(query.search).trim()) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i')

    filter.$or = [
      { donorName: regex },
      { phone: regex },
      { email: regex },
      { transactionId: regex },
      { projectTitle: regex },
      { fundCategoryName: regex },
      { note: regex },
    ]
  }

  return filter
}

router.post('/create', upload.single('proofImage'), async (req, res) => {
  try {
    const payload = await buildDonationPayload(req, 'website')

    const donation = await Donation.create(payload)

    return res.status(201).json({
      message:
        'Donation submitted successfully. It will be verified and updated within one day.',
      donation: formatDonation(req, donation),
    })
  } catch (error) {
    if (req.file) {
      removeProofFile(`/uploads/donations/${req.file.filename}`)
    }

    return res.status(400).json({
      message: error.message || 'Donation submission failed.',
    })
  }
})

router.post('/', upload.single('proofImage'), async (req, res) => {
  try {
    const payload = await buildDonationPayload(req, 'website')

    const donation = await Donation.create(payload)

    return res.status(201).json({
      message:
        'Donation submitted successfully. It will be verified and updated within one day.',
      donation: formatDonation(req, donation),
    })
  } catch (error) {
    if (req.file) {
      removeProofFile(`/uploads/donations/${req.file.filename}`)
    }

    return res.status(400).json({
      message: error.message || 'Donation submission failed.',
    })
  }
})

router.get('/', async (req, res) => {
  try {
    const filter = {
      status: 'verified',
    }

    if (req.query.project && isValidObjectId(req.query.project)) {
      filter.project = req.query.project
    }

    if (req.query.category && isValidObjectId(req.query.category)) {
      filter.fundCategory = req.query.category
    }

    const donations = await Donation.find(filter).sort({ createdAt: -1 }).limit(100)

    return res.json({
      donations: donations.map((item) => formatDonation(req, item)),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get donations.',
      error: error.message,
    })
  }
})

router.get('/recent', async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'verified' })
      .sort({ createdAt: -1 })
      .limit(10)

    return res.json({
      donations: donations.map((item) => formatDonation(req, item)),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get recent donations.',
      error: error.message,
    })
  }
})

router.get('/search/:phone', async (req, res) => {
  try {
    const phone = String(req.params.phone || '').trim()

    if (!phone) {
      return res.status(400).json({
        message: 'Phone number is required.',
      })
    }

    const donations = await Donation.find({
      phone,
      status: 'verified',
    }).sort({ createdAt: -1 })

    const totalDonated = donations.reduce((sum, item) => {
      return sum + Number(item.amount || 0)
    }, 0)

    return res.json({
      totalDonated,
      totalDonation: totalDonated,
      count: donations.length,
      history: donations.map((item) => formatDonation(req, item)),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get donation history.',
      error: error.message,
    })
  }
})

router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const filter = buildDonationFilter(req.query)

    const donations = await Donation.find(filter).sort({ createdAt: -1 })

    const total = await Donation.countDocuments(filter)
    const pending = await Donation.countDocuments({ ...filter, status: 'pending' })
    const verified = await Donation.countDocuments({ ...filter, status: 'verified' })
    const rejected = await Donation.countDocuments({ ...filter, status: 'rejected' })

    const verifiedAmountResult = await Donation.aggregate([
      { $match: { ...filter, status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    const pendingAmountResult = await Donation.aggregate([
      { $match: { ...filter, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    return res.json({
      donations: donations.map((item) => formatDonation(req, item)),
      summary: {
        total,
        pending,
        verified,
        rejected,
        verifiedAmount: verifiedAmountResult[0]?.total || 0,
        pendingAmount: pendingAmountResult[0]?.total || 0,
      },
    })
  } catch (error) {
    console.log('Admin donations error:', error.message)

    return res.status(500).json({
      message: 'Failed to get admin donations.',
      error: error.message,
    })
  }
})

router.get('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      })
    }

    const donation = await Donation.findById(req.params.id)

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      })
    }

    return res.json({
      donation: formatDonation(req, donation),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get donation.',
      error: error.message,
    })
  }
})

router.post(
  '/admin/create',
  protect,
  adminOnly,
  upload.single('proofImage'),
  async (req, res) => {
    try {
      const payload = await buildDonationPayload(req, 'admin')

      payload.verifiedBy = payload.status === 'verified' ? req.user._id : null
      payload.verifiedAt = payload.status === 'verified' ? new Date() : null
      payload.rejectedAt = payload.status === 'rejected' ? new Date() : null

      const donation = await Donation.create(payload)

      if (donation.status === 'verified' && donation.project) {
        await applyProjectAmount(donation.project, donation.amount)
      }

      return res.status(201).json({
        message: 'Donation created successfully.',
        donation: formatDonation(req, donation),
      })
    } catch (error) {
      if (req.file) {
        removeProofFile(`/uploads/donations/${req.file.filename}`)
      }

      return res.status(400).json({
        message: error.message || 'Donation create failed.',
      })
    }
  }
)

router.put(
  '/admin/:id',
  protect,
  adminOnly,
  upload.single('proofImage'),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: 'Invalid donation id.',
        })
      }

      const donation = await Donation.findById(req.params.id)

      if (!donation) {
        return res.status(404).json({
          message: 'Donation not found.',
        })
      }

      const oldDonation = donation.toObject()
      const payload = await buildDonationPayload(req, 'admin')

      if (!payload.proofImage) {
        delete payload.proofImage
      } else if (donation.proofImage) {
        removeProofFile(donation.proofImage)
      }

      if (payload.status === 'verified') {
        payload.verifiedAt = donation.verifiedAt || new Date()
        payload.verifiedBy = donation.verifiedBy || req.user._id
        payload.rejectedAt = null
      } else if (payload.status === 'rejected') {
        payload.rejectedAt = donation.rejectedAt || new Date()
        payload.verifiedAt = null
        payload.verifiedBy = null
      } else {
        payload.verifiedAt = null
        payload.verifiedBy = null
        payload.rejectedAt = null
      }

      Object.assign(donation, payload)

      await donation.save()
      await syncVerifiedProjectAmount(oldDonation, donation)

      return res.json({
        message: 'Donation updated successfully.',
        donation: formatDonation(req, donation),
      })
    } catch (error) {
      if (req.file) {
        removeProofFile(`/uploads/donations/${req.file.filename}`)
      }

      return res.status(400).json({
        message: error.message || 'Donation update failed.',
      })
    }
  }
)

router.put('/admin/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      })
    }

    const donation = await Donation.findById(req.params.id)

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      })
    }

    if (donation.status === 'verified') {
      return res.json({
        message: 'Donation already verified.',
        donation: formatDonation(req, donation),
      })
    }

    donation.status = 'verified'
    donation.adminNote = req.body.adminNote || donation.adminNote || ''
    donation.verifiedAt = new Date()
    donation.verifiedBy = req.user._id
    donation.rejectedAt = null

    await donation.save()

    if (donation.project) {
      await applyProjectAmount(donation.project, donation.amount)
    }

    return res.json({
      message: 'Donation verified successfully.',
      donation: formatDonation(req, donation),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Donation verify failed.',
      error: error.message,
    })
  }
})

router.put('/admin/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      })
    }

    const donation = await Donation.findById(req.params.id)

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      })
    }

    if (donation.status === 'verified' && donation.project) {
      await reverseProjectAmount(donation.project, donation.amount)
    }

    donation.status = 'rejected'
    donation.adminNote = req.body.adminNote || donation.adminNote || ''
    donation.rejectedAt = new Date()
    donation.verifiedAt = null
    donation.verifiedBy = null

    await donation.save()

    return res.json({
      message: 'Donation rejected successfully.',
      donation: formatDonation(req, donation),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Donation reject failed.',
      error: error.message,
    })
  }
})

router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation id.',
      })
    }

    const donation = await Donation.findById(req.params.id)

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found.',
      })
    }

    if (donation.status === 'verified' && donation.project) {
      await reverseProjectAmount(donation.project, donation.amount)
    }

    if (donation.proofImage) {
      removeProofFile(donation.proofImage)
    }

    await donation.deleteOne()

    return res.json({
      message: 'Donation deleted successfully.',
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Donation delete failed.',
      error: error.message,
    })
  }
})

module.exports = router