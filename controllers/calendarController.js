const Interview = require('../models/Interview');
const Reminder = require('../models/Reminder');

// @desc    Get aggregated calendar events: interviews, follow-ups, HR calls, assessment deadlines
// @route   GET /api/calendar
// @access  Private
const getCalendarEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch interviews with scheduled dates
    const scheduledInterviews = await Interview.find({
      user: userId,
      'interviewSchedule.date': { $ne: null }
    }).select('company job interviewSchedule status additionalInfo').lean();

    // Fetch interviews with next follow-up dates
    const followUpInterviews = await Interview.find({
      user: userId,
      'additionalInfo.nextFollowUpDate': { $ne: null }
    }).select('company job interviewSchedule status additionalInfo').lean();

    // Fetch reminders
    const reminders = await Reminder.find({ user: userId })
      .populate('interview', 'company.name company.logo job.role')
      .lean();

    const calendarEvents = [];
    const dateMap = {};
    const seenInterviewScheduleIds = new Set();
    const seenInterviewFollowUpIds = new Set();

    // 1. Process scheduled interviews
    scheduledInterviews.forEach(item => {
      if (item.interviewSchedule && item.interviewSchedule.date) {
        const d = new Date(item.interviewSchedule.date);
        const dateKey = d.toISOString().split('T')[0];
        seenInterviewScheduleIds.add(String(item._id));

        const isCompleted = ['Selected', 'Rejected', 'Withdrawn'].includes(item.status) || d < new Date();

        const event = {
          id: `interview-${item._id}`,
          interviewId: item._id,
          title: `${item.company?.name || 'Company'} Interview (${item.interviewSchedule.round || 'Round'})`,
          companyName: item.company?.name,
          companyLogo: item.company?.logo,
          role: item.job?.role,
          type: 'Interview',
          date: item.interviewSchedule.date,
          dateKey,
          time: item.interviewSchedule.time || '10:00 AM',
          mode: item.interviewSchedule.mode || 'Online',
          linkOrLocation: item.interviewSchedule.locationOrMeetingLink || '',
          status: item.status,
          isCompleted
        };

        calendarEvents.push(event);

        if (!dateMap[dateKey]) dateMap[dateKey] = [];
        dateMap[dateKey].push(event);
      }
    });

    // 2. Process follow-ups from interviews
    followUpInterviews.forEach(item => {
      if (item.additionalInfo && item.additionalInfo.nextFollowUpDate) {
        const d = new Date(item.additionalInfo.nextFollowUpDate);
        const dateKey = d.toISOString().split('T')[0];
        seenInterviewFollowUpIds.add(String(item._id));

        const event = {
          id: `followup-${item._id}`,
          interviewId: item._id,
          title: `Follow-up with ${item.company?.name || 'Company'}`,
          companyName: item.company?.name,
          companyLogo: item.company?.logo,
          role: item.job?.role,
          type: 'Follow-up',
          date: item.additionalInfo.nextFollowUpDate,
          dateKey,
          time: '11:00 AM',
          mode: 'Phone / Email',
          linkOrLocation: item.additionalInfo.followUpNotes || item.interviewSchedule?.hrContact || '',
          status: item.status,
          isCompleted: d < new Date()
        };

        calendarEvents.push(event);

        if (!dateMap[dateKey]) dateMap[dateKey] = [];
        dateMap[dateKey].push(event);
      }
    });

    // 3. Process standalone reminders & attach reminderIds to existing interview events
    reminders.forEach(r => {
      if (r.date) {
        const linkedId = r.interview?._id ? String(r.interview._id) : (r.interview ? String(r.interview) : null);

        // Deduplicate: if linked to an existing interview event, attach reminderId & sync completion
        if (linkedId) {
          if (r.type === 'Interview' && seenInterviewScheduleIds.has(linkedId)) {
            const existingEvt = calendarEvents.find(e => e.interviewId && String(e.interviewId) === linkedId && e.type === 'Interview');
            if (existingEvt) {
              existingEvt.reminderId = r._id;
              existingEvt.isCompleted = r.isCompleted ?? existingEvt.isCompleted;
            }
            return;
          }
          if (r.type === 'Follow-up' && seenInterviewFollowUpIds.has(linkedId)) {
            const existingEvt = calendarEvents.find(e => e.interviewId && String(e.interviewId) === linkedId && e.type === 'Follow-up');
            if (existingEvt) {
              existingEvt.reminderId = r._id;
              existingEvt.isCompleted = r.isCompleted ?? existingEvt.isCompleted;
            }
            return;
          }
        }

        const d = new Date(r.date);
        const dateKey = d.toISOString().split('T')[0];

        const event = {
          id: `reminder-${r._id}`,
          reminderId: r._id,
          interviewId: linkedId,
          title: r.title,
          companyName: r.interview?.company?.name || 'Interview Task',
          companyLogo: r.interview?.company?.logo || '',
          role: r.interview?.job?.role || '',
          type: r.type,
          date: r.date,
          dateKey,
          time: r.time,
          mode: r.type === 'HR Call' ? 'Phone' : 'Schedule',
          linkOrLocation: r.notes || '',
          status: r.isCompleted ? 'Completed' : 'Pending',
          isCompleted: r.isCompleted
        };

        calendarEvents.push(event);

        if (!dateMap[dateKey]) dateMap[dateKey] = [];
        dateMap[dateKey].push(event);
      }
    });

    // Sort all events chronologically
    calendarEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Split upcoming and past
    const now = new Date();
    const upcoming = calendarEvents.filter(e => new Date(e.date) >= new Date(now.setHours(0, 0, 0, 0)));
    const past = calendarEvents.filter(e => new Date(e.date) < new Date(now.setHours(0, 0, 0, 0)));

    res.status(200).json({
      success: true,
      count: calendarEvents.length,
      events: calendarEvents,
      dateMap,
      upcoming,
      past
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCalendarEvents
};
