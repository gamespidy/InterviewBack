const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: 'Technology'
  },
  location: {
    type: String,
    default: ''
  },
  linkedinUrl: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'auto-search'
  }
}, {
  timestamps: true
});

companySchema.index({ name: 'text', industry: 'text' });

module.exports = mongoose.model('Company', companySchema);
