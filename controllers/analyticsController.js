const Interview = require('../models/Interview');
const InterviewQuestion = require('../models/InterviewQuestion');

// @desc    Calculate rich analytics and visualizations from real MongoDB records
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Total applications count
    const totalApplications = await Interview.countDocuments({ user: userId });

    // 2. Status counts
    const statusCountsAgg = await Interview.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCounts = {};
    statusCountsAgg.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    const selectedCount = statusCounts['Selected'] || 0;
    const rejectedCount = statusCounts['Rejected'] || 0;
    const onHoldCount = statusCounts['On Hold'] || 0;
    const appliedCount = statusCounts['Applied'] || 0;
    const withdrawnCount = statusCounts['Withdrawn'] || 0;

    // Interview stage statuses:
    const interviewStageStatuses = ['Interview Scheduled', 'Technical Round', 'HR Round', 'Selected', 'Rejected'];
    const interviewsCompleted = (selectedCount + rejectedCount);
    const interviewsPending = (statusCounts['Interview Scheduled'] || 0) +
      (statusCounts['Technical Round'] || 0) +
      (statusCounts['HR Round'] || 0) +
      (statusCounts['Assessment Pending'] || 0);

    // Calculate rates
    const conversionRate = totalApplications > 0
      ? Math.round(((interviewsCompleted + interviewsPending) / totalApplications) * 100)
      : 0;

    const selectionRate = totalApplications > 0
      ? Math.round((selectedCount / totalApplications) * 100)
      : 0;

    const rejectionRate = totalApplications > 0
      ? Math.round((rejectedCount / totalApplications) * 100)
      : 0;

    // 3. Applications by Month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const applicationsByMonthAgg = await Interview.aggregate([
      {
        $match: {
          user: userId,
          'job.applicationDate': { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$job.applicationDate' },
            month: { $month: '$job.applicationDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    // Format months nicely
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const applicationsByMonth = applicationsByMonthAgg.map(item => ({
      label: `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`,
      count: item.count
    }));

    // 4. Applications by Job Role
    const applicationsByRoleAgg = await Interview.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$job.role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    const applicationsByRole = applicationsByRoleAgg.map(item => ({
      role: item._id || 'Unknown',
      count: item.count
    }));

    // 5. Applications by Source
    const applicationsBySourceAgg = await Interview.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$job.source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const applicationsBySource = applicationsBySourceAgg.map(item => ({
      source: item._id || 'Other',
      count: item.count
    }));

    // 6. Status Distribution Array for donut/bar charts
    const allStatuses = [
      'Applied',
      'Assessment Pending',
      'Assessment Completed',
      'Interview Scheduled',
      'Technical Round',
      'HR Round',
      'Selected',
      'Rejected',
      'On Hold',
      'Withdrawn'
    ];

    const statusDistribution = allStatuses.map(status => ({
      status,
      count: statusCounts[status] || 0
    })).filter(s => s.count > 0 || ['Applied', 'Interview Scheduled', 'Selected', 'Rejected'].includes(s.status));

    // 7. Questions statistics
    const totalQuestions = await InterviewQuestion.countDocuments({ user: userId });
    const favoriteQuestions = await InterviewQuestion.countDocuments({ user: userId, isFavorite: true });
    const questionsByCategory = await InterviewQuestion.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 8. Detailed Month-wise Breakdown (Total Received/Applied, Attended, Rejected, Pending, Selected)
    const userInterviews = await Interview.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('company job status interviewSchedule createdAt')
      .lean();

    const monthlyMap = new Map();
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    userInterviews.forEach(item => {
      const dateVal = item.interviewSchedule?.date || item.job?.applicationDate || item.createdAt;
      const d = dateVal ? new Date(dateVal) : new Date();
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${fullMonthNames[monthIdx]} ${year}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          key,
          label,
          year,
          month: monthIdx + 1,
          total: 0,
          attended: 0,
          pending: 0,
          rejected: 0,
          selected: 0,
          interviews: []
        });
      }

      const m = monthlyMap.get(key);
      m.total += 1;

      const isAttended = ['Technical Round', 'HR Round', 'Assessment Completed', 'Selected', 'Rejected'].includes(item.status);
      const isPending = ['Applied', 'Assessment Pending', 'Interview Scheduled', 'On Hold'].includes(item.status);
      const isRejected = item.status === 'Rejected';
      const isSelected = item.status === 'Selected';

      if (isAttended) m.attended += 1;
      if (isPending) m.pending += 1;
      if (isRejected) m.rejected += 1;
      if (isSelected) m.selected += 1;

      m.interviews.push({
        _id: item._id,
        companyName: item.company?.name || 'Company',
        role: item.job?.role || 'Role',
        status: item.status,
        date: dateVal
      });
    });

    const monthlyBreakdown = Array.from(monthlyMap.values()).sort((a, b) => b.key.localeCompare(a.key));

    if (monthlyBreakdown.length === 0) {
      const now = new Date();
      const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const curLabel = `${fullMonthNames[now.getMonth()]} ${now.getFullYear()}`;
      monthlyBreakdown.push({
        key: curKey,
        label: curLabel,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        total: 0,
        attended: 0,
        pending: 0,
        rejected: 0,
        selected: 0,
        interviews: []
      });
    }

    res.status(200).json({
      success: true,
      analytics: {
        totalApplications,
        conversionRate,
        selectionRate,
        rejectionRate,
        interviewsCompleted,
        interviewsPending,
        selectedCount,
        rejectedCount,
        onHoldCount,
        appliedCount,
        applicationsByMonth,
        applicationsByRole,
        applicationsBySource,
        statusDistribution,
        monthlyBreakdown,
        questions: {
          total: totalQuestions,
          favorites: favoriteQuestions,
          byCategory: questionsByCategory.map(c => ({ category: c._id, count: c.count }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAnalytics
};
