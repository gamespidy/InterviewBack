const mongoose = require('mongoose');

const statusHistorySubSchema = new mongoose.Schema({
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
}, { _id: true });

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  company: {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    website: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    industry: {
      type: String,
      default: 'Technology'
    },
    logo: {
      type: String,
      default: ''
    },
    linkedinUrl: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  },
  job: {
    role: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['Full-Time', 'Internship', 'Contract'],
      default: 'Full-Time'
    },
    experience: {
      type: String,
      default: '2-4 years'
    },
    salary: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    applicationDate: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      default: 'LinkedIn',
      trim: true
    }
  },
  interviewSchedule: {
    date: {
      type: Date,
      default: null
    },
    time: {
      type: String,
      default: ''
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Phone'],
      default: 'Online'
    },
    locationOrMeetingLink: {
      type: String,
      default: ''
    },
    round: {
      type: String,
      default: 'Technical Round 1'
    },
    hrName: {
      type: String,
      default: ''
    },
    hrContact: {
      type: String,
      default: ''
    },
    hrEmail: {
      type: String,
      default: '',
      trim: true
    }
  },
  status: {
    type: String,
    enum: [
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
    ],
    default: 'Applied',
    index: true
  },
  additionalInfo: {
    rejectionReason: {
      type: String,
      default: ''
    },
    selectionFeedback: {
      type: String,
      default: ''
    },
    personalNotes: {
      type: String,
      default: ''
    },
    nextFollowUpDate: {
      type: Date,
      default: null
    },
    followUpNotes: {
      type: String,
      default: ''
    }
  },
  statusHistory: [statusHistorySubSchema]
}, {
  timestamps: true
});

interviewSchema.index({ 'company.name': 'text', 'job.role': 'text', 'company.location': 'text' });

module.exports = mongoose.model('Interview', interviewSchema);
