import express from 'express';
import { upload } from '../middleware/upload.js';
import axios from 'axios';

const router = express.Router();
const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(`${PYTHON_SERVICE}/ocr`, formData, {
      headers: formData.getHeaders(),
      timeout: 300000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    res.json(response.data);
  } catch (err) {
    console.error('OCR error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.detail || err.message || 'OCR failed' });
  }
});

export default router;