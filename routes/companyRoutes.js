const express = require('express');
const router = express.Router();
const { searchCompanies, getAllCompanies, createCompany } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search', searchCompanies);
router.get('/', getAllCompanies);
router.post('/', createCompany);

module.exports = router;
