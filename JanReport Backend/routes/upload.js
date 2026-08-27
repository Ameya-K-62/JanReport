import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// @route   POST /api/upload/image
// @desc    Upload image to Cloudinary
// @access  Private (authenticated users)
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      // Convert buffer to base64 string for Cloudinary
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: 'janreport', // Optional: organize images in a folder
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Resize if needed
          { quality: 'auto' }, // Optimize quality
        ],
      });

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        },
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error.message,
      });
    }
  }
);

// @route   POST /api/upload/image-base64
// @desc    Upload base64 image to Cloudinary (for camera captures)
// @access  Private (authenticated users)
router.post('/image-base64', authenticate, async (req, res) => {
  try {
    const { imageDataUrl } = req.body;

    if (!imageDataUrl) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    // Validate base64 data URL format - check for proper data URL structure
    if (typeof imageDataUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Image data must be a string',
      });
    }

    // Check if it's a valid data URL format - more flexible pattern
    const trimmedUrl = imageDataUrl.trim();
    if (!trimmedUrl.startsWith('data:image/')) {
      console.error('Invalid image format received. First 100 chars:', imageDataUrl.substring(0, 100));
      console.error('Full length:', imageDataUrl.length);
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected base64 data URL starting with data:image/',
      });
    }

    // Check if it contains base64 data
    if (!trimmedUrl.includes('base64,') && !trimmedUrl.includes(';base64,')) {
      console.error('Missing base64 marker. Format:', trimmedUrl.substring(0, 50));
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected base64 data URL',
      });
    }

    // Extract base64 part and validate it's not empty
    const base64Index = trimmedUrl.indexOf(',');
    if (base64Index === -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data URL format - missing comma separator',
      });
    }

    const base64Data = trimmedUrl.substring(base64Index + 1);
    if (!base64Data || base64Data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Empty image data',
      });
    }

    // Use the trimmed URL for Cloudinary upload
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(trimmedUrl, {
      folder: 'janreport',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
      ],
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
});

export default router;
