import dotenv from "dotenv";
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';
import ocrRoutes from './routes/ocr.js';

// ✅ EXISTING AI ROUTE
import aiRoutes from './routes/ai.js';

// ✅ NEW: MODERATION ROUTE (Gemini REAL/FAKE)
import moderationRoutes from './routes/moderation.js';

// Load environment variables
dotenv.config();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ocr', ocrRoutes);

// ✅ EXISTING AI ROUTE (UNCHANGED)
app.use('/api/ai', aiRoutes);

// ✅ NEW ROUTE (ADDED SAFELY)
app.use('/api/moderation', moderationRoutes);

// Geocoding proxy
app.get('/api/geocode', async (req, res) => {
  const query = req.query.q;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Query parameter "q" is required'
    });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JanReport/1.0 (contact: support@janreport.local)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: 'Geocoding service error',
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Geocoding proxy error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to geocode location'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running'
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {

    console.log('Connected to MongoDB');

    try {

      const usersCollection = mongoose.connection.db.collection('users');
      const indexes = await usersCollection.indexes();

      const hasStaleGoogleIdIndex = indexes.some(
        (idx) => idx.name === 'googleId_1'
      );

      if (hasStaleGoogleIdIndex) {
        await usersCollection.dropIndex('googleId_1');
        console.log('🧹 Removed stale users.googleId_1 unique index');
      }

    } catch (indexError) {
      console.warn('Skipped stale index cleanup:', indexError.message);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;