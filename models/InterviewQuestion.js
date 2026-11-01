const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'JavaScript',
      'React.js',
      'React Native',
      'Node.js',
      'Express.js',
      'MongoDB',
      'SQL / MySQL',
      'Java',
      'HTML / CSS',
      'Data Structures',
      'Problem Solving',
      'HR Questions',
      'Project-Based Questions',
      'Aptitude',
      'Other'
    ],
    default: 'Other',
    index: true
  },
  answerGiven: {
    type: String,
    default: ''
  },
  improvedAnswer: {
    type: String,
    default: ''
  },
  difficultyLevel: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  round: {
    type: String,
    default: 'Technical Round 1'
  },
  personalFeedback: {
    type: String,
    default: ''
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  isAnsweredCorrectly: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

interviewQuestionSchema.index({ question: 'text' });

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
