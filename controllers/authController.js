const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'interview_log_super_secure_jwt_secret_key_2026_production', {
    expiresIn: '30d'
  });
};

// @desc    Login user & get token (supports on-the-fly initial account setup without any seed scripts)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const defaultEmail = (process.env.DEFAULT_USER_EMAIL || 'siva@gmail.com').toLowerCase();
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'Siva@123';

    let user = await User.findOne({ email: cleanEmail });

    // If user does not exist yet and matches the credentials, create on the fly (Zero seed data required)
    if (!user) {
      if (cleanEmail === defaultEmail && password === defaultPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = await User.create({
          name: process.env.DEFAULT_USER_NAME || 'Siva',
          email: cleanEmail,
          password: hashedPassword,
          role: 'candidate'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
    } else {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user / clear token on client
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  login,
  getMe,
  logout
};
