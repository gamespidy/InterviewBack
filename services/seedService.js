const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Interview = require('../models/Interview');
const InterviewQuestion = require('../models/InterviewQuestion');
const StatusHistory = require('../models/StatusHistory');
const Reminder = require('../models/Reminder');
const CompanyService = require('./companyService');

const seedDefaultData = async () => {
  try {
    // 1. Seed verified company catalog for the auto-fill search feature
    await CompanyService.seedPresetCompanies();

    // 2. Seed Default User (siva@gmail.com / Siva@123) with bcrypt hash as required for authentication
    const defaultEmail = (process.env.DEFAULT_USER_EMAIL || 'siva@gmail.com').toLowerCase();
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'Siva@123';
    const defaultName = process.env.DEFAULT_USER_NAME || 'Siva';

    let user = await User.findOne({ email: defaultEmail });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      user = await User.create({
        name: defaultName,
        email: defaultEmail,
        password: hashedPassword,
        role: 'candidate'
      });

      console.log(`[SeedService] Created default account: ${defaultEmail}`);
    } else {
      console.log(`[SeedService] Default user active: ${defaultEmail}`);
    }

    // Notice: All dummy/sample interview records are completely disabled as requested.
    // The user will add all real-time interviews, questions, and reminders manually.
  } catch (err) {
    console.error('[SeedService] Error:', err.message);
  }
};

// Utility to completely wipe any previous seed data
const cleanAllInterviewData = async () => {
  try {
    await Promise.all([
      Interview.deleteMany({}),
      InterviewQuestion.deleteMany({}),
      StatusHistory.deleteMany({}),
      Reminder.deleteMany({})
    ]);
    console.log('[SeedService] Successfully purged all dummy interview data. Database is 100% clean for real data!');
  } catch (err) {
    console.error('[SeedService] Error purging interview data:', err.message);
  }
};

module.exports = { seedDefaultData, cleanAllInterviewData };
