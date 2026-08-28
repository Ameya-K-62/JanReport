import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      default: null,
      min: -180,
      max: 180,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Breaking News',
        'Traffic',
        'Infrastructure',
        'Public Safety',
        'Environment',
        'Community Event',
        'Other',
      ],
    },
    image: {
      type: String, // Cloudinary URL
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    // For future AI moderation integration
    aiAnalysis: {
      bertNlp: {
        confidence: Number,
        result: String,
      },
      resnet50: {
        confidence: Number,
        result: String,
      },
      errorLevelAnalysis: {
        result: String,
      },
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    suspicionLevel: {
      type: String,
      enum: ['suspicious', 'unverified', 'potential'],
      default: 'unverified',
    },
    rejectedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ author: 1 });
reportSchema.index({ category: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
