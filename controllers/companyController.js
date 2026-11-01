const CompanyService = require('../services/companyService');
const Company = require('../models/Company');

// @desc    Search companies by name/domain with auto-fill data & MongoDB caching
// @route   GET /api/companies/search?q=...
// @access  Private
const searchCompanies = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        count: 0,
        companies: []
      });
    }

    const results = await CompanyService.searchCompany(q);

    res.status(200).json({
      success: true,
      count: results.length,
      companies: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching companies'
    });
  }
};

// @desc    Get all cached companies
// @route   GET /api/companies
// @access  Private
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 }).limit(100);
    res.status(200).json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add or save custom company
// @route   POST /api/companies
// @access  Private
const createCompany = async (req, res) => {
  try {
    const { name, website, logo, description, industry, location, linkedinUrl } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const company = await Company.create({
      name,
      website: website || '',
      logo: logo || '',
      description: description || '',
      industry: industry || 'Technology',
      location: location || '',
      linkedinUrl: linkedinUrl || '',
      source: 'manual-entry'
    });

    res.status(201).json({
      success: true,
      company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  searchCompanies,
  getAllCompanies,
  createCompany
};
