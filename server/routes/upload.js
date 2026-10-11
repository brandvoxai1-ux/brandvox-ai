// server/routes/upload.js
const path = require('path');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const supabase = require('../lib/supabase');
// Store file in memory buffer (no disk writes)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF image files are allowed.'));
    }
  }
});

/**
 * POST /api/upload/image
 * Uploads an image file to Supabase Storage 'uploads' bucket
 * and returns the permanent public URL.
 */
router.post('/image', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided in the request.' });
  }

  try {
    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const filename = `${req.user.id}/${Date.now()}.${ext}`;

    console.log(`[UploadService] Uploading image: ${filename} (${req.file.size} bytes)`);

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    console.log(`[UploadService] Upload successful. Public URL: ${publicUrl}`);

    res.json({
      success: true,
      url: publicUrl,
      filename
    });
  } catch (err) {
    console.error('[UploadService] Upload failed:', err.message);
    res.status(500).json({ error: err.message || 'Image upload failed. Please try again.' });
  }
});

const videoUpload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200 MB max for videos up to 30s+ in high quality
  },
  fileFilter: (req, file, cb) => {
    const isVideo = file.mimetype?.startsWith('video/') ||
      /\.(mp4|webm|mov|mkv|avi|3gp|flv|m4v|wmv|ts)$/i.test(file.originalname);
    if (isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Please upload a valid video file.'));
    }
  }
});

/**
 * POST /api/upload/video
 * Uploads a source reference video file to Supabase Storage 'uploads' bucket
 * with automated 7-day ephemeral retention.
 */
router.post('/video', authMiddleware, videoUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided in the request.' });
  }

  try {
    const origExt = (path.extname(req.file.originalname || '') || '').toLowerCase().replace('.', '');
    const mimeExt = req.file.mimetype === 'video/quicktime' ? 'mov' : (req.file.mimetype?.split('/')[1] || 'mp4');
    const ext = origExt || mimeExt || 'mp4';
    const filename = `${req.user.id}/source_${Date.now()}.${ext}`;

    console.log(`[UploadService] Direct fast-upload to storage: ${filename} (${req.file.size} bytes)`);

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype || 'video/mp4',
        upsert: true
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    console.log(`[UploadService] Video upload complete. Public URL: ${publicUrl}`);

    res.json({
      success: true,
      url: publicUrl,
      filename
    });
  } catch (err) {
    console.error('[UploadService] Video upload failed:', err.message);
    res.status(500).json({ error: err.message || 'Video upload failed. Please try again.' });
  }
});

module.exports = router;
