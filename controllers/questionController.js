const InterviewQuestion = require('../models/InterviewQuestion');
const Interview = require('../models/Interview');

// @desc    Get all questions for user with filtering, search, and category
// @route   GET /api/questions
// @access  Private
const getAllQuestions = async (req, res) => {
  try {
    const { category, difficulty, isFavorite, q, interviewId } = req.query;
    const query = { user: req.user._id };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (difficulty && difficulty !== 'All') {
      query.difficultyLevel = difficulty;
    }
    if (isFavorite === 'true') {
      query.isFavorite = true;
    }
    if (interviewId) {
      query.interview = interviewId;
    }
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [
        { question: regex },
        { answerGiven: regex },
        { improvedAnswer: regex },
        { round: regex }
      ];
    }

    const questions = await InterviewQuestion.find(query)
      .populate('interview', 'company.name company.logo job.role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get questions for specific interview
// @route   GET /api/interviews/:id/questions
// @access  Private
const getQuestionsByInterview = async (req, res) => {
  try {
    const questions = await InterviewQuestion.find({
      interview: req.params.id,
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add question to an interview
// @route   POST /api/interviews/:id/questions
// @access  Private
const createQuestion = async (req, res) => {
  try {
    const { id: interviewId } = req.params;
    const {
      question,
      category = 'Other',
      answerGiven = '',
      improvedAnswer = '',
      difficultyLevel = 'Medium',
      round = 'Technical Round 1',
      personalFeedback = '',
      isFavorite = false
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question text is required'
      });
    }

    // Verify interview exists and belongs to user
    const interview = await Interview.findOne({
      _id: interviewId,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview application not found'
      });
    }

    const newQuestion = await InterviewQuestion.create({
      interview: interview._id,
      user: req.user._id,
      question: question.trim(),
      category,
      answerGiven,
      improvedAnswer,
      difficultyLevel,
      round,
      personalFeedback,
      isFavorite: Boolean(isFavorite)
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      question: newQuestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const allowedUpdates = [
      'question',
      'category',
      'answerGiven',
      'improvedAnswer',
      'difficultyLevel',
      'round',
      'personalFeedback',
      'isFavorite'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    });

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle favorite on question
// @route   PATCH /api/questions/:id/favorite
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const question = await InterviewQuestion.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    question.isFavorite = !question.isFavorite;
    await question.save();

    res.status(200).json({
      success: true,
      message: `Question ${question.isFavorite ? 'added to' : 'removed from'} favorites`,
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllQuestions,
  getQuestionsByInterview,
  createQuestion,
  updateQuestion,
  toggleFavorite,
  deleteQuestion
};
