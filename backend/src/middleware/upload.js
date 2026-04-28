// src/middleware/upload.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed image types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Upload single image
const uploadImage = async (file, folder = 'auctions') => {
  try {
    if (!file) return null;
    
    // Validate file type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.');
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum size is 10MB.');
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: `catawiki/${folder}`,
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });
    
    // Clean up temp file
    if (fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }
    
    return result.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Upload multiple images
const uploadMultipleImages = async (files, folder = 'auctions') => {
  if (!files || !files.images) return [];
  
  const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
  const uploadPromises = imageFiles.map(file => uploadImage(file, folder));
  
  const results = await Promise.allSettled(uploadPromises);
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
};

// Delete image from Cloudinary
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    
    // Extract public ID from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = `catawiki/${urlParts[urlParts.length - 2]}/${filename.split('.')[0]}`;
    
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

// Local upload fallback (when Cloudinary is not configured)
const localUploadDir = path.join(__dirname, '../../uploads');

const ensureUploadDir = () => {
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
};

const uploadImageLocal = async (file, folder = 'auctions') => {
  ensureUploadDir();
  
  const folderPath = path.join(localUploadDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const filename = `${timestamp}_${random}_${file.name}`;
  const filePath = path.join(folderPath, filename);
  
  await file.mv(filePath);
  
  return `/uploads/${folder}/${filename}`;
};

const uploadMultipleImagesLocal = async (files, folder = 'auctions') => {
  if (!files || !files.images) return [];
  
  const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
  const uploadPromises = imageFiles.map(file => uploadImageLocal(file, folder));
  
  return await Promise.all(uploadPromises);
};

// Use Cloudinary if configured, otherwise use local
const upload = process.env.CLOUDINARY_CLOUD_NAME ? uploadImage : uploadImageLocal;
const uploadMultiple = process.env.CLOUDINARY_CLOUD_NAME ? uploadMultipleImages : uploadMultipleImagesLocal;

module.exports = {
  uploadImage: upload,
  uploadMultipleImages: uploadMultiple,
  deleteImage,
};