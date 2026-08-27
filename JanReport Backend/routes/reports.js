import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Report from '../models/Report.js';
import { authenticate, isModerator } from '../middleware/auth.js';
import { analyzeIncident } from '../services/incidentAnalysis.js';
import { sendApprovalEmail, sendRejectionEmail } from "../services/emailService.js";

const router = express.Router();

// @route   POST /api/reports/analyze-incident
// @desc    Analyze incident sentiment and severity using Hugging Face BERT
// @access  Private
router.post(
  '/analyze-incident',
  authenticate,
  [
    body('title').optional().isString().withMessage('Title must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('location').optional().isString().withMessage('Location must be a string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { title, description, location } = req.body;
      const analysis = await analyzeIncident({ title, description, location });

      res.json({
        success: true,
        message: 'Incident analysis completed',
        data: analysis,
      });
    } catch (error) {
      console.error('Analyze incident error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze incident',
        error: error.message,
      });
    }
  }
);

// @route   POST /api/reports
// @desc    Submit a new report
// @access  Private (authenticated users)
router.post(
  '/',
  authenticate,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required'),
    body('latitude')
      .optional({ nullable: true })
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .optional({ nullable: true })
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('category')
      .isIn([
        'Breaking News',
        'Traffic',
        'Infrastructure',
        'Public Safety',
        'Environment',
        'Community Event',
        'Other',
      ])
      .withMessage('Invalid category'),
    body('image')
      .optional()
      .custom((value) => {
        if (value === null || value === '') {
          return true; // Allow null/empty
        }
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          return true;
        }
        // If provided, must be a valid URL
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      })
      .withMessage('Image must be a valid URL or data URL if provided'),
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

      const { title, description, location, category, image, latitude, longitude } = req.body;

      let sentimentSeverityAnalysis = null;
      try {
        sentimentSeverityAnalysis = await analyzeIncident({ title, description, location });
      } catch (analysisError) {
        console.warn('Incident analysis skipped:', analysisError.message);
      }

      const derivedPriority = sentimentSeverityAnalysis?.severity?.level === 'high'
        ? 'high'
        : sentimentSeverityAnalysis?.severity?.level === 'medium'
          ? 'medium'
          : 'low';

      // Create new report
      const report = new Report({
        title,
        description,
        location,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        category,
        image: image || null,
        author: req.userId,
        status: 'pending', // All reports start as pending
        priority: derivedPriority,
        aiAnalysis: sentimentSeverityAnalysis
          ? {
              bertNlp: {
                confidence: sentimentSeverityAnalysis.sentiment.confidence,
                result: sentimentSeverityAnalysis.sentiment.result,
              },
              resnet50: {
                confidence: 0,
                result: image ? 'Image analysis pending' : 'No image provided',
              },
              errorLevelAnalysis: {
                result: sentimentSeverityAnalysis.severity.result,
              },
            }
          : undefined,
      });

      await report.save();

      // Populate author info
      await report.populate('author', 'email userType');

      res.status(201).json({
        success: true,
        message: 'Report submitted successfully. It will be reviewed by our moderation team.',
        data: {
          report: {
            id: report._id,
            title: report.title,
            description: report.description,
            location: report.location,
            latitude: report.latitude,
            longitude: report.longitude,
            category: report.category,
            image: report.image,
            status: report.status,
            author: report.author.email,
            views: report.views,
            likes: report.likes,
            comments: report.comments,
            createdAt: report.createdAt,
          },
        },
      });
    } catch (error) {
      console.error('Submit report error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while submitting report',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/reports
// @desc    Get all approved reports
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const skip = (page - 1) * limit;

    // Build query
    const query = { status: 'approved' };
    if (category) {
      query.category = category;
    }

    // Get reports
    const reports = await Report.find(query)
      .populate('author', 'email userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-aiAnalysis -rejectedReason -suspicionLevel -priority');

    // Get total count
    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports: reports.map((report) => ({
          id: report._id,
          title: report.title,
          description: report.description,
          location: report.location,
          latitude: report.latitude,
          longitude: report.longitude,
          category: report.category,
          image: report.image,
          author: report.author?.email || 'anonymous',
          timestamp: report.createdAt,
          views: report.views,
          likes: report.likes,
          comments: report.comments,
          status: report.status,
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: skip + limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports',
      error: error.message,
    });
  }
});

// @route   GET /api/reports/pending
// @desc    Get all pending reports (for moderators)
// @access  Private (moderators only)
router.get('/pending', authenticate, isModerator, async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('author', 'email userType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        reports: reports.map((report) => ({
          id: report._id,
          title: report.title,
          description: report.description,
          location: report.location,
          latitude: report.latitude,
          longitude: report.longitude,
          category: report.category,
          image: report.image,
          author: report.author?.email || 'anonymous',
          timestamp: report.createdAt,
          status: report.status,
          priority: report.priority,
          suspicionLevel: report.suspicionLevel,
          aiAnalysis: report.aiAnalysis,
        })),
      },
    });
  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending reports',
      error: error.message,
    });
  }
});

// @route   GET /api/reports/moderation
// @desc    Get reports by status for moderators
// @access  Private (moderators only)
router.get('/moderation', authenticate, isModerator, async (req, res) => {
  try {
    const status = req.query.status || 'pending';

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected',
      });
    }

    const reports = await Report.find({ status })
      .populate('author', 'email userType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        reports: reports.map((report) => ({
          id: report._id,
          title: report.title,
          description: report.description,
          location: report.location,
          latitude: report.latitude,
          longitude: report.longitude,
          category: report.category,
          image: report.image,
          author: report.author?.email || 'anonymous',
          timestamp: report.createdAt,
          status: report.status,
          priority: report.priority,
          suspicionLevel: report.suspicionLevel,
          aiAnalysis: report.aiAnalysis,
          rejectedReason: report.rejectedReason,
        })),
      },
    });
  } catch (error) {
    console.error('Get moderation reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching moderation reports',
      error: error.message,
    });
  }
});

// @route   PATCH /api/reports/:id/status
// @desc    Approve or reject a report
// @access  Private (moderators only)

router.patch(
  "/:id/status",
  authenticate,
  isModerator,
  [
    body("status")
      .isIn(["approved", "rejected"])
      .withMessage("Status must be approved or rejected"),

    body("reason").optional().isString(),
    body("rejectedReason").optional().isString(),
  ],
  async (req, res) => {
    try {

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { status, reason, rejectedReason } = req.body;

      const report = await Report.findById(req.params.id).populate(
        "author",
        "email userType"
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      // IMPORTANT: accept both reason fields
      let finalReason = reason || rejectedReason;

      // fallback if moderator didn't provide reason
      if (!finalReason) {

        if (status === "approved") {
          finalReason =
            "The report has been reviewed and verified by the moderation team. The submitted details and evidence confirm the validity of the incident.";
        }

        if (status === "rejected") {
          finalReason =
            "The report could not be approved because the information provided was insufficient or could not be verified through reliable sources.";
        }

      }

      // update report
      report.status = status;

      if (status === "approved") {
        report.approvalReason = finalReason;
        report.rejectedReason = null;
      }

      if (status === "rejected") {
        report.rejectedReason = finalReason;
        report.approvalReason = null;
      }

      await report.save();

      const userEmail = report.author.email;

      try {

        if (status === "approved") {

          await sendApprovalEmail(
            userEmail,
            report.title,
            finalReason
          );

        }

        if (status === "rejected") {

          await sendRejectionEmail(
            userEmail,
            report.title,
            finalReason
          );

        }

      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      res.json({
        success: true,
        message: `Report ${status} successfully`,
        data: {
          report: {
            id: report._id,
            title: report.title,
            status: report.status,
            reason: finalReason,
          },
        },
      });

    } catch (error) {

      console.error("Update report status error:", error);

      res.status(500).json({
        success: false,
        message: "Server error while updating report status",
      });

    }
  }
);

// @route   GET /api/reports/analytics
// @desc    Get analytics data for dashboard
// @access  Private
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const allowedRanges = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
    const range = allowedRanges[req.query.range] ? req.query.range : '30d';
    const rangeDays = allowedRanges[range];

    const requestedScope = req.query.scope === 'moderator' ? 'moderator' : 'user';
    const scope = req.userType === 'moderator' ? requestedScope : 'user';

    const statusFilter = ['pending', 'approved', 'rejected'].includes(req.query.status)
      ? req.query.status
      : 'all';

    const categoryFilter = typeof req.query.category === 'string' && req.query.category.trim()
      ? req.query.category.trim()
      : 'all';

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - rangeDays);

    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevEndDate.getDate() - rangeDays);

    const baseMatch = {
      createdAt: { $gte: startDate, $lte: now },
    };

    if (scope === 'user') {
      baseMatch.author = new mongoose.Types.ObjectId(req.userId);
    }

    if (statusFilter !== 'all') {
      baseMatch.status = statusFilter;
    }

    if (categoryFilter !== 'all') {
      baseMatch.category = categoryFilter;
    }

    const previousMatch = {
      ...baseMatch,
      createdAt: { $gte: prevStartDate, $lt: prevEndDate },
    };

    const [kpiRows, previousRows, timeSeriesRows, categoryRows, priorityRows, locationRows] = await Promise.all([
      Report.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            pendingReports: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            approvedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
            rejectedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
            },
            moderatedCount: {
              $sum: { $cond: [{ $in: ['$status', ['approved', 'rejected']] }, 1, 0] },
            },
            resolvedHoursTotal: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['approved', 'rejected']] },
                  {
                    $divide: [
                      { $subtract: ['$updatedAt', '$createdAt'] },
                      1000 * 60 * 60,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
      Report.aggregate([
        { $match: previousMatch },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            pendingReports: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            approvedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
            rejectedReports: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
            },
          },
        },
      ]),
      Report.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            submitted: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Report.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Report.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Report.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const kpiBase = kpiRows[0] || {
      totalReports: 0,
      pendingReports: 0,
      approvedReports: 0,
      rejectedReports: 0,
      moderatedCount: 0,
      resolvedHoursTotal: 0,
    };

    const previousBase = previousRows[0] || {
      totalReports: 0,
      pendingReports: 0,
      approvedReports: 0,
      rejectedReports: 0,
    };

    const approvalRate = kpiBase.totalReports
      ? Number(((kpiBase.approvedReports / kpiBase.totalReports) * 100).toFixed(1))
      : 0;

    const avgResolutionHours = kpiBase.moderatedCount
      ? Number((kpiBase.resolvedHoursTotal / kpiBase.moderatedCount).toFixed(1))
      : 0;

    res.json({
      success: true,
      data: {
        scope,
        range,
        filters: {
          status: statusFilter,
          category: categoryFilter,
        },
        kpis: {
          totalReports: kpiBase.totalReports,
          pendingReports: kpiBase.pendingReports,
          approvedReports: kpiBase.approvedReports,
          rejectedReports: kpiBase.rejectedReports,
          approvalRate,
          avgResolutionHours,
          previousPeriod: {
            totalReports: previousBase.totalReports,
            pendingReports: previousBase.pendingReports,
            approvedReports: previousBase.approvedReports,
            rejectedReports: previousBase.rejectedReports,
          },
        },
        timeSeries: timeSeriesRows.map((item) => ({
          date: item._id,
          submitted: item.submitted,
          approved: item.approved,
          rejected: item.rejected,
        })),
        categoryBreakdown: categoryRows.map((item) => ({
          category: item._id,
          count: item.count,
        })),
        priorityBreakdown: priorityRows.map((item) => ({
          priority: item._id,
          count: item.count,
        })),
        topLocations: locationRows.map((item) => ({
          location: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
      error: error.message,
    });
  }
});

// @route   GET /api/reports/mine
// @desc    Get current user's reports (pending and approved)
// @access  Private
router.get('/mine', authenticate, async (req, res) => {
  try {
    const reports = await Report.find({ author: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        reports: reports.map((report) => ({
          id: report._id,
          title: report.title,
          description: report.description,
          location: report.location,
          latitude: report.latitude,
          longitude: report.longitude,
          category: report.category,
          image: report.image,
          author: req.user.email, // Since we know the author is the current user
          timestamp: report.createdAt,
          status: report.status,
          views: report.views,
          likes: report.likes,
          comments: report.comments,
        })),
      },
    });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your reports',
      error: error.message,
    });
  }
});


// @route   GET /api/reports/:id
// @desc    Get a single report by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate(
      'author',
      'email userType'
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Increment views
    report.views += 1;
    await report.save();

    res.json({
      success: true,
      data: {
        report: {
          id: report._id,
          title: report.title,
          description: report.description,
          location: report.location,
          latitude: report.latitude,
          longitude: report.longitude,
          category: report.category,
          image: report.image,
          author: report.author?.email || 'anonymous',
          timestamp: report.createdAt,
          views: report.views,
          likes: report.likes,
          comments: report.comments,
          status: report.status,
        },
      },
    });
  } catch (error) {
    console.error('Get report error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report',
      error: error.message,
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private (owner or moderator with approved reports)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    const isModeratorUser = req.userType === 'moderator';
    const isOwner = report.author.toString() === req.userId;

    if (isModeratorUser) {
      if (report.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Moderators can only delete approved reports',
        });
      }
    } else if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reports',
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully',
      data: {
        id: req.params.id,
      },
    });
  } catch (error) {
    console.error('Delete report error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting report',
      error: error.message,
    });
  }
});

export default router;
