import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dwirp7qmx',
  api_key: process.env.CLOUDINARY_API_KEY || '125619544278274',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'v29wcw5J_4JAbEUtW47tMjH4am4',
  secure: true,
});

export default cloudinary;
