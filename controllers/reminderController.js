const Reminder = require('../models/Reminder');
const Interview = require('../models/Interview');

// @desc    Get all reminders for user
// @route   GET /api/reminders
// @access  Private
const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id })
      .populate('interview', 'company.name company.logo job.role')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new reminder
// @route   POST /api/reminders
// @access  Private
const createReminder = async (req, res) => {
  try {
    const { title, type = 'Follow-up', date, time = '10:00 AM', notes = '', interviewId } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: 'Title and date are required'
      });
    }

    const reminder = await Reminder.create({
      user: req.user._id,
      interview: interviewId || null,
      title: title.trim(),
      type,
      date: new Date(date),
      time,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      reminder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle reminder completion
// @route   PATCH /api/reminders/:id/toggle
// @access  Private
const toggleReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    reminder.isCompleted = !reminder.isCompleted;
    await reminder.save();

    res.status(200).json({
      success: true,
      message: `Reminder marked as ${reminder.isCompleted ? 'completed' : 'pending'}`,
      reminder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update reminder details
// @route   PUT /api/reminders/:id
// @access  Private
const updateReminder = async (req, res) => {
  try {
    const { title, type, date, time, notes, isCompleted } = req.body;
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    if (title !== undefined) reminder.title = title.trim();
    if (type !== undefined) reminder.type = type;
    if (date !== undefined) reminder.date = new Date(date);
    if (time !== undefined) reminder.time = time.trim();
    if (notes !== undefined) reminder.notes = notes.trim();
    if (isCompleted !== undefined) reminder.isCompleted = isCompleted;

    await reminder.save();

    // If this reminder is linked to an interview, sync interview schedule or follow-up
    if (reminder.interview) {
      if (reminder.type === 'Follow-up') {
        await Interview.findOneAndUpdate(
          { _id: reminder.interview, user: req.user._id },
          {
            'additionalInfo.nextFollowUpDate': reminder.date,
            'additionalInfo.followUpNotes': reminder.notes
          }
        );
      } else if (reminder.type === 'Interview') {
        await Interview.findOneAndUpdate(
          { _id: reminder.interview, user: req.user._id },
          {
            'interviewSchedule.date': reminder.date,
            'interviewSchedule.time': reminder.time
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Reminder updated successfully',
      reminder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // If linked to an interview, also clear nextFollowUpDate or interview schedule
    if (reminder.interview) {
      if (reminder.type === 'Follow-up') {
        await Interview.findOneAndUpdate(
          { _id: reminder.interview, user: req.user._id },
          {
            'additionalInfo.nextFollowUpDate': null,
            'additionalInfo.followUpNotes': ''
          }
        );
      } else if (reminder.type === 'Interview') {
        await Interview.findOneAndUpdate(
          { _id: reminder.interview, user: req.user._id },
          {
            'interviewSchedule.date': null,
            'interviewSchedule.time': '',
            'interviewSchedule.locationOrMeetingLink': ''
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder
};
