const express = require('express');
const router = express.Router();
const {
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  deleteInterview,
  getDashboardStats
} = require('../controllers/interviewController');
const { updateStatus, getStatusHistory } = require('../controllers/statusController');
const { createQuestion, getQuestionsByInterview } = require('../controllers/questionController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Dashboard stats
router.get('/dashboard', getDashboardStats);

// Status updates & history
router.put('/:id/status', updateStatus);
router.get('/:id/status-history', getStatusHistory);

// Questions per interview
router.get('/:id/questions', getQuestionsByInterview);
router.post('/:id/questions', createQuestion);

// Main CRUD
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.post('/', createInterview);
router.put('/:id', updateInterview);
router.delete('/:id', deleteInterview);

module.exports = router;
