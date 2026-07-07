import express from 'express';
import axios from 'axios';

const router = express.Router();
const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

router.get('/', async (req, res) => {
  let pythonStatus = 'disconnected';
  let pythonData = {};

  try {
    const response = await axios.get(`${PYTHON_SERVICE}/health`, { timeout: 5000 });
    pythonStatus = 'connected';
    pythonData = response.data;
  } catch (error) {
    pythonStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    pythonService: {
      status: pythonStatus,
      ...pythonData,
    },
  });
});

export default router;