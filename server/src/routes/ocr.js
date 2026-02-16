import express from 'express';
import { upload } from '../middleware/upload.js';
import { extractTextFromImage } from '../services/ocrService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// POST /api/ocr - Process image with OCR
router.post('/', upload.single('image'), async (req, res) => {
  let imagePath;
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    imagePath = path.resolve(__dirname, '../../uploads', req.file.filename);
    const extracted = await extractTextFromImage(imagePath);

    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    res.json(extracted);
  } catch (error) {
    if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    console.error('OCR error:', error);
    res.status(500).json({ error: error.message || 'OCR processing failed' });
  }
});

export default router;
