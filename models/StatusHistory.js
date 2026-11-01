const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    index: true
  },
  fromStatus: {
    type: String,
    default: null
  },
  toStatus: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StatusHistory', statusHistorySchema);
