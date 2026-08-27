# Cloudinary Integration Setup

## Overview
Images are now stored in Cloudinary instead of as base64 strings in the database. Only Cloudinary URLs are stored in MongoDB.

## Configuration

### Environment Variables
Add these to your `.env` file:
```env
CLOUDINARY_API_KEY=125619544278274
CLOUDINARY_API_SECRET=v29wcw5J_4JAbEUtW47tMjH4am4
CLOUDINARY_CLOUD_NAME=dwirp7qmx
```

## Installation

Install required packages:
```bash
npm install cloudinary multer
```

## API Endpoints

### POST `/api/upload/image-base64`
Upload a base64 image to Cloudinary.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "imageDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dwirp7qmx/image/upload/v1234567890/janreport/xyz.jpg",
    "publicId": "janreport/xyz"
  }
}
```

## Image Flow

1. **User captures photo** → Base64 data URL created
2. **Upload to Cloudinary** → Image uploaded via `/api/upload/image-base64`
3. **Store URL** → Only Cloudinary URL stored in database
4. **Display** → Images loaded from Cloudinary CDN

## Benefits

- ✅ Reduced database size (no base64 strings)
- ✅ Faster image loading (CDN)
- ✅ Automatic image optimization
- ✅ Better scalability
- ✅ Image transformations available

## Image Storage Location

All images are stored in the `janreport` folder on Cloudinary:
- Path: `janreport/[auto-generated-id]`
- Format: Optimized JPEG
- Max dimensions: 1200x1200px (auto-resized)
