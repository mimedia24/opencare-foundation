const express = require('express');

const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Project = require('../models/Project');
const User = require('../models/User');
const VolunteerApplication = require('../models/VolunteerApplication');
const BloodDonationRequest = require('../models/BloodDonationRequest');
const FundCategory = require('../models/FundCategory');

const router = express.Router();

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const isVerifiedDonation = (item) => {
  return !item.status || item.status === 'verified';
};

const isPendingDonation = (item) => {
  return item.status === 'pending';
};

const isRejectedDonation = (item) => {
  return item.status === 'rejected';
};

const isPublishedExpense = (item) => {
  return !item.status || item.status === 'published';
};

const getLastTwelveMonths = () => {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    months.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      name: `${monthNames[month]} ${String(year).slice(-2)}`,
      donation: 0,
      expense: 0,
    });
  }

  return months;
};

const getMonthKey = (date) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '';

  return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
};

const groupByAmount = (items, keyGetter) => {
  const map = new Map();

  items.forEach((item) => {
    const key = keyGetter(item) || 'General';

    if (!map.has(key)) {
      map.set(key, {
        name: key,
        amount: 0,
        count: 0,
      });
    }

    const current = map.get(key);
    current.amount += Number(item.amount || 0);
    current.count += 1;
  });

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
};

router.get('/', async (req, res) => {
  try {
    const [
      donations,
      expenses,
      projects,
      totalUsers,
      totalCategories,
      pendingVolunteerApplications,
      pendingBloodDonationRequests,
    ] = await Promise.all([
      Donation.find({}).lean(),
      Expense.find({}).lean(),
      Project.find({}).sort({ createdAt: -1 }).lean(),
      User.countDocuments({}),
      FundCategory.countDocuments({}),
      VolunteerApplication.countDocuments({ status: 'pending' }),
      BloodDonationRequest.countDocuments({ status: 'pending' }),
    ]);

    const verifiedDonations = donations.filter(isVerifiedDonation);
    const pendingDonations = donations.filter(isPendingDonation);
    const rejectedDonations = donations.filter(isRejectedDonation);
    const publishedExpenses = expenses.filter(isPublishedExpense);
    const draftExpenses = expenses.filter((item) => item.status === 'draft');
    const hiddenExpenses = expenses.filter((item) => item.status === 'hidden');

    const totalDonation = verifiedDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pendingDonation = pendingDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const rejectedDonation = rejectedDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalExpense = publishedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const draftExpenseAmount = draftExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const hiddenExpenseAmount = hiddenExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const allExpenseAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const availableFund = totalDonation - totalExpense;

    const totalVolunteers = await User.countDocuments({
      isVolunteer: true,
      volunteerStatus: 'approved',
    });

    const totalBloodDonors = await User.countDocuments({
      isBloodDonor: true,
    });

    const verifiedBloodDonors = await User.countDocuments({
      isBloodDonor: true,
      isBloodDonorVerified: true,
    });

    const activeProjects = projects.filter((item) => item.status === 'active').length;
    const pausedProjects = projects.filter((item) => item.status === 'paused').length;
    const completedProjects = projects.filter((item) => item.status === 'completed').length;

    const projectTargetAmount = projects.reduce((sum, item) => sum + Number(item.targetAmount || 0), 0);
    const projectCollectedAmount = projects.reduce((sum, item) => sum + Number(item.collectedAmount || 0), 0);
    const projectRemainingAmount = Math.max(projectTargetAmount - projectCollectedAmount, 0);

    const monthlyFinance = getLastTwelveMonths();
    const monthlyMap = new Map(monthlyFinance.map((item) => [item.key, item]));

    verifiedDonations.forEach((item) => {
      const key = getMonthKey(item.verifiedAt || item.createdAt);

      if (monthlyMap.has(key)) {
        monthlyMap.get(key).donation += Number(item.amount || 0);
      }
    });

    publishedExpenses.forEach((item) => {
      const key = getMonthKey(item.expenseDate || item.createdAt);

      if (monthlyMap.has(key)) {
        monthlyMap.get(key).expense += Number(item.amount || 0);
      }
    });

    const projectWise = projects.map((project) => {
      const targetAmount = Number(project.targetAmount || 0);
      const collectedAmount = Number(project.collectedAmount || 0);
      const remainingAmount = Math.max(targetAmount - collectedAmount, 0);
      const progressPercent =
        targetAmount > 0 ? Math.min(Math.round((collectedAmount / targetAmount) * 100), 100) : 0;

      return {
        _id: project._id,
        title: project.title,
        slug: project.slug,
        status: project.status,
        targetAmount,
        collectedAmount,
        remainingAmount,
        progressPercent,
      };
    });

    const categoryWiseDonation = groupByAmount(verifiedDonations, (item) => {
      return item.fundCategoryName || 'General Donation';
    });

    const categoryWiseExpense = groupByAmount(publishedExpenses, (item) => {
      return item.category || 'General Expense';
    });

    const paymentMethodWise = groupByAmount(verifiedDonations, (item) => {
      return item.paymentMethod || 'other';
    });

    res.status(200).json({
      totalDonation,
      pendingDonation,
      rejectedDonation,
      totalExpense,
      allExpenseAmount,
      draftExpenseAmount,
      hiddenExpenseAmount,
      availableFund,

      verifiedDonationCount: verifiedDonations.length,
      pendingDonationCount: pendingDonations.length,
      rejectedDonationCount: rejectedDonations.length,

      totalExpenseCount: publishedExpenses.length,
      allExpenseCount: expenses.length,
      draftExpenseCount: draftExpenses.length,
      hiddenExpenseCount: hiddenExpenses.length,

      totalUsers,
      totalVolunteers,
      totalBloodDonors,
      verifiedBloodDonors,
      pendingVolunteerApplications,
      pendingBloodDonationRequests,

      totalCategories,

      totalProjects: projects.length,
      activeProjects,
      pausedProjects,
      completedProjects,
      projectTargetAmount,
      projectCollectedAmount,
      projectRemainingAmount,

      monthlyFinance,
      projectWise,
      categoryWiseDonation,
      categoryWiseExpense,
      paymentMethodWise,

      lastUpdatedAt: new Date(),
    });
  } catch (error) {
    console.log('Stats error:', error.message);

    res.status(500).json({
      message: 'Failed to get dashboard stats.',
      error: error.message,
    });
  }
});

module.exports = router;