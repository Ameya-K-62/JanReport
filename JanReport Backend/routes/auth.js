import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// JWT Secret (should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .customSanitizer((value) => String(value).toLowerCase()),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('userType')
      .isIn(['user', 'moderator'])
      .withMessage('User type must be either "user" or "moderator"'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const email = String(req.body.email || '').trim().toLowerCase();
      const { password, userType } = req.body;

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = new User({
        email,
        password: hashedPassword,
        userType: userType || 'user',
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, userType: user.userType },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            userType: user.userType,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      if (error?.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern || {})[0] || 'email';
        const duplicateValue = error.keyValue?.[duplicateField];
        return res.status(400).json({
          success: false,
          message:
            duplicateField === 'email'
              ? 'User with this email already exists'
              : `Duplicate value for ${duplicateField}`,
          duplicateField,
          duplicateValue,
        });
      }
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: error.message,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .customSanitizer((value) => String(value).toLowerCase()),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('userType')
      .optional()
      .isIn(['user', 'moderator'])
      .withMessage('User type must be either "user" or "moderator"'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const email = String(req.body.email || '').trim().toLowerCase();
      const { password, userType } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (userType && user.userType !== userType) {
        return res.status(403).json({
          success: false,
          message: `This account is registered as ${user.userType}. Please use the ${user.userType} tab.`,
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, userType: user.userType },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            userType: user.userType,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
        error: error.message,
      });
    }
  }
);

export default router;
