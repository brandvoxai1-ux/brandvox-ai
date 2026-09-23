// server/routes/upload.js
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

module.exports = router;
