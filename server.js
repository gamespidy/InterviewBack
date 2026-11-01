require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const questionRoutes = require('./routes/questionRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    appName: 'INTERVIEW LOG API',
    tagline: 'Track Every Interview. Learn From Every Experience.',
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reminders', reminderRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and start server without any seed scripts
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🚀 INTERVIEW LOG BACKEND IS RUNNING ON PORT ${PORT}`);
      console.log(`📡 Local URL: http://localhost:${PORT}/api/health`);
      console.log(`📱 LAN Network URL: http://192.168.1.7:${PORT}/api/health`);
      console.log(`🔐 Candidate Auth: siva@gmail.com / Siva@123`);
      console.log(`✨ Pure Real-Time Mode: Ready for manual entries`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
