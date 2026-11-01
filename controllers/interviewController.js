const Interview = require('../models/Interview');
const InterviewQuestion = require('../models/InterviewQuestion');
const StatusHistory = require('../models/StatusHistory');
const Reminder = require('../models/Reminder');

// @desc    Get all interviews with search, filter, sort, pagination
// @route   GET /api/interviews
// @access  Private
const getInterviews = async (req, res) => {
  try {
    const {
      q,
      status,
      jobRole,
      jobType,
      source,
      location,
      sortBy = 'recently_added',
      page = 1,
      limit = 20
    } = req.query;

    const query = { user: req.user._id };

    // Search query
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { 'company.name': searchRegex },
        { 'job.role': searchRegex },
        { 'company.location': searchRegex },
        { 'company.industry': searchRegex }
      ];
    }

    // Specific filters
    if (status && status !== 'All') {
      query.status = status;
    }
    if (jobRole && jobRole !== 'All') {
      query['job.role'] = new RegExp(jobRole.trim(), 'i');
    }
    if (jobType && jobType !== 'All') {
      query['job.type'] = jobType;
    }
    if (source && source !== 'All') {
      query['job.source'] = new RegExp(source.trim(), 'i');
    }
    if (location && location !== 'All') {
      query['company.location'] = new RegExp(location.trim(), 'i');
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'upcoming') {
      sortOptions = { 'interviewSchedule.date': 1 };
    } else if (sortBy === 'recently_updated') {
      sortOptions = { updatedAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [interviews, total] = await Promise.all([
      Interview.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Interview.countDocuments(query)
    ]);

    // Attach questions count to each interview
    const interviewIds = interviews.map(i => i._id);
    const questionsCountAgg = await InterviewQuestion.aggregate([
      { $match: { interview: { $in: interviewIds } } },
      { $group: { _id: '$interview', count: { $sum: 1 } } }
    ]);

    const countMap = new Map();
    questionsCountAgg.forEach(item => countMap.set(item._id.toString(), item.count));

    const enrichedInterviews = interviews.map(i => ({
      ...i,
      questionsCount: countMap.get(i._id.toString()) || 0
    }));

    res.status(200).json({
      success: true,
      count: enrichedInterviews.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      interviews: enrichedInterviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single interview details
// @route   GET /api/interviews/:id
// @access  Private
const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    }).lean();

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Fetch related questions
    const questions = await InterviewQuestion.find({
      interview: req.params.id,
      user: req.user._id
    }).sort({ createdAt: -1 });

    // Fetch full status history
    const statusHistory = await StatusHistory.find({
      interview: req.params.id
    }).sort({ changedAt: -1 });

    res.status(200).json({
      success: true,
      interview: {
        ...interview,
        questions,
        statusHistory: statusHistory.length > 0 ? statusHistory : interview.statusHistory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new interview application
// @route   POST /api/interviews
// @access  Private
const createInterview = async (req, res) => {
  try {
    const {
      company,
      job,
      interviewSchedule,
      status = 'Applied',
      additionalInfo
    } = req.body;

    if (!company || !company.name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    if (!job || !job.role) {
      return res.status(400).json({
        success: false,
        message: 'Job role is required'
      });
    }

    const initialHistoryEntry = {
      fromStatus: null,
      toStatus: status,
      notes: 'Application created',
      changedAt: new Date()
    };

    const newInterview = await Interview.create({
      user: req.user._id,
      company: {
        name: company.name.trim(),
        website: company.website || '',
        location: company.location || '',
        industry: company.industry || 'Technology',
        logo: company.logo || '',
        linkedinUrl: company.linkedinUrl || '',
        description: company.description || ''
      },
      job: {
        role: job.role.trim(),
        type: job.type || 'Full-Time',
        experience: job.experience || '',
        salary: job.salary || '',
        description: job.description || '',
        applicationDate: job.applicationDate ? new Date(job.applicationDate) : new Date(),
        source: job.source || 'LinkedIn'
      },
      interviewSchedule: {
        date: interviewSchedule?.date ? new Date(interviewSchedule.date) : null,
        time: interviewSchedule?.time || '',
        mode: interviewSchedule?.mode || 'Online',
        locationOrMeetingLink: interviewSchedule?.locationOrMeetingLink || '',
        round: interviewSchedule?.round || 'Round 1',
        hrName: interviewSchedule?.hrName || '',
        hrContact: interviewSchedule?.hrContact || '',
        hrEmail: interviewSchedule?.hrEmail ? interviewSchedule.hrEmail.trim().toLowerCase() : ''
      },
      status,
      additionalInfo: {
        rejectionReason: additionalInfo?.rejectionReason || '',
        selectionFeedback: additionalInfo?.selectionFeedback || '',
        personalNotes: additionalInfo?.personalNotes || '',
        nextFollowUpDate: additionalInfo?.nextFollowUpDate ? new Date(additionalInfo.nextFollowUpDate) : null
      },
      statusHistory: [initialHistoryEntry]
    });

    // Also persist in StatusHistory model
    await StatusHistory.create({
      interview: newInterview._id,
      fromStatus: null,
      toStatus: status,
      notes: 'Application created',
      changedAt: new Date()
    });

    // If an interview date or follow-up date is provided, create linked reminder
    if (interviewSchedule?.date) {
      await Reminder.create({
        user: req.user._id,
        interview: newInterview._id,
        title: `${company.name} - ${interviewSchedule.round || 'Interview'}`,
        type: 'Interview',
        date: new Date(interviewSchedule.date),
        time: interviewSchedule.time || '10:00 AM',
        notes: `Mode: ${interviewSchedule.mode || 'Online'}`
      });
    }

    if (additionalInfo?.nextFollowUpDate) {
      await Reminder.create({
        user: req.user._id,
        interview: newInterview._id,
        title: `Follow up with ${company.name}`,
        type: 'Follow-up',
        date: new Date(additionalInfo.nextFollowUpDate),
        time: '11:00 AM',
        notes: additionalInfo.followUpNotes ? additionalInfo.followUpNotes.trim() : `Follow up for ${job.role}`
      });
    }

    // Process inline questions if provided
    const { questions = [] } = req.body;
    if (Array.isArray(questions) && questions.length > 0) {
      const questionDocs = questions
        .filter(q => q && q.question && q.question.trim())
        .map(q => ({
          interview: newInterview._id,
          user: req.user._id,
          question: q.question.trim(),
          answerGiven: q.answerGiven ? q.answerGiven.trim() : '',
          isAnsweredCorrectly: q.isAnsweredCorrectly !== false,
          category: q.category || 'Other',
          round: interviewSchedule?.round || q.round || 'Technical Round 1'
        }));

      if (questionDocs.length > 0) {
        await InterviewQuestion.insertMany(questionDocs);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Interview application created successfully',
      interview: newInterview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update interview details
// @route   PUT /api/interviews/:id
// @access  Private
const updateInterview = async (req, res) => {
  try {
    const existing = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    const {
      company,
      job,
      interviewSchedule,
      status,
      additionalInfo,
      statusChangeNotes
    } = req.body;

    const previousStatus = existing.status;
    const isStatusChanged = status && status !== previousStatus;

    if (company) {
      existing.company = { ...existing.company.toObject(), ...company };
    }
    if (job) {
      existing.job = { ...existing.job.toObject(), ...job };
    }
    if (interviewSchedule !== undefined) {
      if (interviewSchedule && interviewSchedule.date) {
        existing.interviewSchedule = { ...existing.interviewSchedule.toObject(), ...interviewSchedule };
        // Sync or upsert linked Interview reminder
        await Reminder.findOneAndUpdate(
          { interview: existing._id, type: 'Interview' },
          {
            user: req.user._id,
            interview: existing._id,
            title: `${existing.company.name} - ${interviewSchedule.round || existing.interviewSchedule.round || 'Interview'}`,
            type: 'Interview',
            date: new Date(interviewSchedule.date),
            time: interviewSchedule.time || existing.interviewSchedule.time || '10:00 AM',
            notes: `Mode: ${interviewSchedule.mode || existing.interviewSchedule.mode || 'Online'}`
          },
          { upsert: true, new: true }
        );
      } else if (interviewSchedule && (interviewSchedule.date === null || interviewSchedule.date === '')) {
        existing.interviewSchedule.date = null;
        existing.interviewSchedule.time = '';
        existing.interviewSchedule.locationOrMeetingLink = '';
        await Reminder.deleteMany({ interview: existing._id, type: 'Interview' });
      } else if (interviewSchedule) {
        existing.interviewSchedule = { ...existing.interviewSchedule.toObject(), ...interviewSchedule };
      }
    }
    if (additionalInfo) {
      existing.additionalInfo = { ...existing.additionalInfo.toObject(), ...additionalInfo };

      // Sync follow-up reminder
      if (additionalInfo.nextFollowUpDate !== undefined) {
        if (additionalInfo.nextFollowUpDate) {
          await Reminder.findOneAndUpdate(
            { interview: existing._id, type: 'Follow-up' },
            {
              user: req.user._id,
              interview: existing._id,
              title: `Follow up with ${existing.company.name}`,
              type: 'Follow-up',
              date: new Date(additionalInfo.nextFollowUpDate),
              time: '11:00 AM',
              notes: additionalInfo.followUpNotes ? additionalInfo.followUpNotes.trim() : `Follow up for ${existing.job.role}`
            },
            { upsert: true, new: true }
          );
        } else {
          existing.additionalInfo.nextFollowUpDate = null;
          existing.additionalInfo.followUpNotes = '';
          await Reminder.deleteMany({ interview: existing._id, type: 'Follow-up' });
        }
      }
    }

    if (isStatusChanged) {
      existing.status = status;
      const historyEntry = {
        fromStatus: previousStatus,
        toStatus: status,
        notes: statusChangeNotes || `Status updated from ${previousStatus} to ${status}`,
        changedAt: new Date()
      };
      existing.statusHistory.push(historyEntry);

      await StatusHistory.create({
        interview: existing._id,
        fromStatus: previousStatus,
        toStatus: status,
        notes: statusChangeNotes || `Status updated from ${previousStatus} to ${status}`,
        changedAt: new Date()
      });
    }

    await existing.save();

    // Sync inline questions if provided
    const { questions } = req.body;
    if (Array.isArray(questions)) {
      await InterviewQuestion.deleteMany({ interview: existing._id, user: req.user._id });
      const questionDocs = questions
        .filter(q => q && q.question && q.question.trim())
        .map(q => ({
          interview: existing._id,
          user: req.user._id,
          question: q.question.trim(),
          answerGiven: q.answerGiven ? q.answerGiven.trim() : '',
          isAnsweredCorrectly: q.isAnsweredCorrectly !== false,
          category: q.category || 'Other',
          round: existing.interviewSchedule?.round || q.round || 'Technical Round 1'
        }));

      if (questionDocs.length > 0) {
        await InterviewQuestion.insertMany(questionDocs);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Interview updated successfully',
      interview: existing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete interview and related records
// @route   DELETE /api/interviews/:id
// @access  Private
const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Cascade delete associated questions, history, reminders
    await Promise.all([
      InterviewQuestion.deleteMany({ interview: req.params.id }),
      StatusHistory.deleteMany({ interview: req.params.id }),
      Reminder.deleteMany({ interview: req.params.id })
    ]);

    res.status(200).json({
      success: true,
      message: 'Interview and associated records deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/interviews/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalApplications,
      interviewsScheduled,
      selectedApplications,
      rejectedApplications,
      onHoldApplications,
      upcomingInterviews,
      recentApplications,
      statusBreakdown
    ] = await Promise.all([
      Interview.countDocuments({ user: userId }),
      Interview.countDocuments({
        user: userId,
        status: { $in: ['Interview Scheduled', 'Technical Round', 'HR Round'] }
      }),
      Interview.countDocuments({ user: userId, status: 'Selected' }),
      Interview.countDocuments({ user: userId, status: 'Rejected' }),
      Interview.countDocuments({ user: userId, status: 'On Hold' }),
      Interview.find({
        user: userId,
        'interviewSchedule.date': { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
        .sort({ 'interviewSchedule.date': 1 })
        .limit(5)
        .lean(),
      Interview.find({ user: userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Interview.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Build timeline of recent activity from statusHistory
    const recentActivity = await StatusHistory.find()
      .populate({
        path: 'interview',
        match: { user: userId },
        select: 'company.name job.role company.logo'
      })
      .sort({ changedAt: -1 })
      .limit(8)
      .lean();

    const filteredRecentActivity = recentActivity.filter(a => a.interview !== null);

    // Current Month Breakdown for quick dashboard access
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthInterviews = await Interview.find({
      user: userId,
      $or: [
        { 'interviewSchedule.date': { $gte: startOfMonth } },
        { createdAt: { $gte: startOfMonth } }
      ]
    }).select('status').lean();

    const thisMonthStats = {
      total: thisMonthInterviews.length,
      attended: thisMonthInterviews.filter(i =>
        ['Technical Round', 'HR Round', 'Assessment Completed', 'Selected', 'Rejected'].includes(i.status)
      ).length,
      pending: thisMonthInterviews.filter(i =>
        ['Applied', 'Assessment Pending', 'Interview Scheduled', 'On Hold'].includes(i.status)
      ).length,
      rejected: thisMonthInterviews.filter(i => i.status === 'Rejected').length,
      selected: thisMonthInterviews.filter(i => i.status === 'Selected').length
    };

    res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        interviewsScheduled,
        selectedApplications,
        rejectedApplications,
        onHoldApplications,
        upcomingInterviews,
        recentApplications,
        statusBreakdown,
        recentActivity: filteredRecentActivity,
        thisMonthStats
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
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  deleteInterview,
  getDashboardStats
};
