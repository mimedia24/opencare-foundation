const express = require('express')

const Donation = require('../models/Donation')
const Expense = require('../models/Expense')
const User = require('../models/User')
const BloodDonationRequest = require('../models/BloodDonationRequest')
const Project = require('../models/Project')

const router = express.Router()

function startOfDay(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfDay(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date()
  date.setHours(23, 59, 59, 999)
  return date
}

function getDateRange(query) {
  const today = new Date()

  if (query.month) {
    const [year, month] = String(query.month).split('-').map(Number)

    if (year && month) {
      const from = new Date(year, month - 1, 1)
      const to = new Date(year, month, 0)
      to.setHours(23, 59, 59, 999)

      return { from, to }
    }
  }

  if (query.dateFrom || query.dateTo) {
    return {
      from: startOfDay(query.dateFrom || query.dateTo),
      to: endOfDay(query.dateTo || query.dateFrom),
    }
  }

  return {
    from: startOfDay(today),
    to: endOfDay(today),
  }
}

function formatDate(date) {
  if (!date) return ''

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString().slice(0, 10)
}

function sumAmount(list, key = 'amount') {
  return list.reduce((total, item) => total + Number(item[key] || 0), 0)
}

function groupByAmount(list, keyName) {
  const map = new Map()

  list.forEach((item) => {
    const key = item[keyName] || 'Uncategorized'
    const current = map.get(key) || {
      name: key,
      amount: 0,
      count: 0,
    }

    current.amount += Number(item.amount || 0)
    current.count += 1

    map.set(key, current)
  })

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
}

function groupBloodRequestsByGroup(list) {
  const map = new Map()

  list.forEach((item) => {
    const key = item.bloodGroup || 'Unknown'
    const current = map.get(key) || {
      name: key,
      bags: 0,
    }

    current.bags += 1

    map.set(key, current)
  })

  return Array.from(map.values()).sort((a, b) => b.bags - a.bags)
}

router.get('/', async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query)

    const verifiedDonations = await Donation.find({
      status: 'verified',
      createdAt: {
        $gte: from,
        $lte: to,
      },
    }).sort({ createdAt: -1 })

    const publishedExpenses = await Expense.find({
      status: 'published',
      expenseDate: {
        $gte: from,
        $lte: to,
      },
    }).sort({ expenseDate: -1 })

    const allVerifiedDonations = await Donation.find({
      status: 'verified',
    })

    const allPublishedExpenses = await Expense.find({
      status: 'published',
    })

    const totalBloodDonors = await User.countDocuments({
      isBloodDonor: true,
    })

    const verifiedBloodDonors = await User.countDocuments({
      isBloodDonor: true,
      isBloodDonorVerified: true,
    })

    const bloodDonorStats = await User.aggregate([
      {
        $match: {
          isBloodDonor: true,
        },
      },
      {
        $group: {
          _id: null,
          totalBags: {
            $sum: {
              $ifNull: ['$totalBloodDonations', 0],
            },
          },
        },
      },
    ])

    const approvedBloodRequests = await BloodDonationRequest.find({
      status: 'approved',
      donationDate: {
        $gte: from,
        $lte: to,
      },
    }).sort({ donationDate: -1 })

    const activeProjects = await Project.find({
      status: 'active',
    }).sort({ createdAt: -1 }).limit(10)

    const completedProjects = await Project.find({
      status: 'completed',
    }).sort({ updatedAt: -1 }).limit(10)

    const periodDonation = sumAmount(verifiedDonations)
    const periodExpense = sumAmount(publishedExpenses)
    const periodAvailable = periodDonation - periodExpense

    const lifetimeDonation = sumAmount(allVerifiedDonations)
    const lifetimeExpense = sumAmount(allPublishedExpenses)
    const lifetimeAvailable = lifetimeDonation - lifetimeExpense

    const incomeByCategory = groupByAmount(verifiedDonations, 'fundCategoryName')
    const expenseByCategory = groupByAmount(publishedExpenses, 'category')
    const bloodByGroup = groupBloodRequestsByGroup(approvedBloodRequests)

    return res.json({
      report: {
        dateFrom: formatDate(from),
        dateTo: formatDate(to),
        generatedAt: new Date().toISOString(),

        periodSummary: {
          totalDonation: periodDonation,
          totalExpense: periodExpense,
          availableFund: periodAvailable,
          donationCount: verifiedDonations.length,
          expenseCount: publishedExpenses.length,
        },

        lifetimeSummary: {
          totalDonation: lifetimeDonation,
          totalExpense: lifetimeExpense,
          availableFund: lifetimeAvailable,
        },

        incomeByCategory,
        expenseByCategory,

        bloodSummary: {
          totalBloodDonors,
          verifiedBloodDonors,
          totalBloodBags: bloodDonorStats[0]?.totalBags || 0,
          periodBloodBags: approvedBloodRequests.length,
          bloodByGroup,
        },

        projects: {
          active: activeProjects.map((project) => ({
            id: project._id,
            title: project.title,
            category: project.category,
            targetAmount: Number(project.targetAmount || 0),
            collectedAmount: Number(project.collectedAmount || 0),
            remainingAmount: Math.max(
              Number(project.targetAmount || 0) - Number(project.collectedAmount || 0),
              0
            ),
            status: project.status,
          })),

          completed: completedProjects.map((project) => ({
            id: project._id,
            title: project.title,
            category: project.category,
            targetAmount: Number(project.targetAmount || 0),
            collectedAmount: Number(project.collectedAmount || 0),
            status: project.status,
          })),
        },

        recentDonations: verifiedDonations.slice(0, 10).map((donation) => ({
          donorName: donation.isAnonymous ? 'Anonymous Donor' : donation.donorName,
          phone: donation.phone,
          amount: Number(donation.amount || 0),
          category: donation.fundCategoryName || 'General Donation',
          project: donation.projectTitle || '',
          date: formatDate(donation.createdAt),
        })),

        recentExpenses: publishedExpenses.slice(0, 10).map((expense) => ({
          title: expense.title,
          amount: Number(expense.amount || 0),
          category: expense.category || 'General Expense',
          project: expense.projectTitle || '',
          date: formatDate(expense.expenseDate),
        })),
      },
    })
  } catch (error) {
    console.log('Report error:', error.message)

    return res.status(500).json({
      message: 'Failed to generate report.',
      error: error.message,
    })
  }
})

module.exports = router