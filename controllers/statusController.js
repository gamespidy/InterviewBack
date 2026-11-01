const Interview = require('../models/Interview');
const StatusHistory = require('../models/StatusHistory');

// @desc    Update application status & record full transition history
// @route   PUT /api/interviews/:id/status
// @access  Private
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes = '' } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New status is required'
      });
    }

    const interview = await Interview.findOne({
      _id: id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview application not found'
      });
    }

    const fromStatus = interview.status;

    // Record transition
    const historyEntry = {
      fromStatus,
      toStatus: status,
      notes: notes || `Status changed from ${fromStatus} to ${status}`,
      changedAt: new Date()
    };

    interview.status = status;
    interview.statusHistory.push(historyEntry);
    await interview.save();

    const createdHistory = await StatusHistory.create({
      interview: interview._id,
      fromStatus,
      toStatus: status,
      notes: notes || `Status changed from ${fromStatus} to ${status}`,
      changedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      interview,
      historyEntry: createdHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get status transition history for an interview
// @route   GET /api/interviews/:id/status-history
// @access  Private
const getStatusHistory = async (req, res) => {
  try {
    const history = await StatusHistory.find({
      interview: req.params.id
    }).sort({ changedAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  updateStatus,
  getStatusHistory
};
