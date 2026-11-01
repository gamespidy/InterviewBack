const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Interview', 'Follow-up', 'HR Call', 'Assessment', 'Other'],
    default: 'Follow-up'
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    default: '10:00 AM'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reminder', reminderSchema);
