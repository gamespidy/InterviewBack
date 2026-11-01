const express = require('express');
const router = express.Router();
const {
  getAllQuestions,
  updateQuestion,
  toggleFavorite,
  deleteQuestion
} = require('../controllers/questionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllQuestions);
router.put('/:id', updateQuestion);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteQuestion);

module.exports = router;
