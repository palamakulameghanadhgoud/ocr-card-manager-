import express from 'express';
import { upload } from '../middleware/upload.js';
import axios from 'axios';
import FormData from 'form-data';
import mongoose from 'mongoose';
import Evaluation from '../models/Evaluation.js';

const router = express.Router();
const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// POST /api/evaluation - evaluate document and optionally save to DB
router.post('/', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { rubric = '', maxMarks = '100' } = req.body;

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('answerKey', JSON.stringify({
      title: 'Exam Script',
      questions: rubric.split('\n').filter(l => l.trim()).map((line, i) => ({
        number: String(i + 1),
        questionText: line.trim(),
        maxMarks: Math.floor(Number(maxMarks) / Math.max(1, rubric.split('\n').filter(l => l.trim()).length)),
        rubric: line.trim(),
      })),
    }));

    const response = await axios.post(`${PYTHON_SERVICE}/evaluate`, formData, {
      headers: formData.getHeaders(),
      timeout: 300000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const resultData = response.data;

    // Create the evaluation result structure
    const resultObject = {
      filename: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      ocrBackend: resultData.ocrBackend,
      graderProvider: resultData.graderProvider,
      pages: resultData.pages || 0,
      extractedText: resultData.extractedText || '',
      answerKey: {
        title: 'Exam Script',
        questions: rubric.split('\n').filter(l => l.trim()).map((line, i) => ({
          number: String(i + 1),
          questionText: line.trim(),
          maxMarks: Math.floor(Number(maxMarks) / Math.max(1, rubric.split('\n').filter(l => l.trim()).length)),
          rubric: line.trim(),
        })),
      },
      perQuestion: resultData.perQuestion || [],
      totalAwarded: resultData.totalAwarded || 0,
      totalMax: resultData.totalMax || 0,
      percentage: resultData.percentage || 0,
      createdAt: new Date(),
    };

    // If MongoDB is connected (readyState === 1), persist the evaluation
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const evaluation = new Evaluation(resultObject);
        await evaluation.save();
        console.log(`Saved evaluation to MongoDB: ${evaluation._id}`);
        return res.status(201).json(evaluation);
      } catch (dbErr) {
        console.error('Failed to save to MongoDB:', dbErr.message);
      }
    }

    // Fallback: MongoDB is offline. Return results successfully without database persistence.
    console.log('MongoDB is disconnected. Returning evaluation results directly without saving.');
    return res.status(200).json({
      _id: `temp_${Date.now()}`,
      ...resultObject,
    });
  } catch (err) {
    console.error('Evaluation error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.detail || err.message || 'Evaluation failed' });
  }
});

// GET /api/evaluation/history - get past evaluations list
router.get('/history', async (req, res, next) => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      // Gracefully return empty list if DB is offline
      return res.json([]);
    }
    const history = await Evaluation.find({}, {
      filename: 1,
      originalName: 1,
      totalAwarded: 1,
      totalMax: 1,
      percentage: 1,
      createdAt: 1,
    }).sort({ createdAt: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// GET /api/evaluation/:id - get detailed evaluation by ID
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(404).json({ error: 'Evaluation not found (Database offline)' });
    }
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    res.json(evaluation);
  } catch (err) {
    next(err);
  }
});

router.post('/grade', async (req, res) => {
  try {
    const { answerKey, segments } = req.body;
    const response = await axios.post(`${PYTHON_SERVICE}/grade`, { answerKey, segments }, { timeout: 60000 });
    res.json(response.data);
  } catch (err) {
    console.error('Grade error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.detail || err.message || 'Grading failed' });
  }
});

export default router;