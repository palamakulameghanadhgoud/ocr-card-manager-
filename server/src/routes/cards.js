import express from 'express';
import Card from '../models/Card.js';
import { upload } from '../middleware/upload.js';
import { extractTextFromImage } from '../services/ocrService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// GET /api/cards - Get all cards with optional filters
router.get('/', async (req, res) => {
  try {
    const { search, industry, relationshipType, priority, tags, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (industry) filter['categories.industry'] = industry;
    if (relationshipType) filter['categories.relationshipType'] = relationshipType;
    if (priority) filter['categories.priority'] = priority;
    if (tags) {
      const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagArr.length) filter.tags = { $in: tagArr };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const cards = await Card.find(filter).sort(sort).lean();
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cards/:id - Get single card
router.get('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).lean();
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cards - Upload and create new card
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const cardData = {
      imageUrl,
      name: req.body.name || '',
      company: req.body.company || '',
      jobTitle: req.body.jobTitle || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      website: req.body.website || '',
      address: req.body.address || '',
      categories: {
        industry: req.body.industry || '',
        relationshipType: req.body.relationshipType || '',
        priority: req.body.priority || '',
      },
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags || '[]')) : [],
      notes: req.body.notes || '',
    };

    const card = await Card.create(cardData);
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cards/:id - Update card
router.put('/:id', async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        company: req.body.company,
        jobTitle: req.body.jobTitle,
        phone: req.body.phone,
        email: req.body.email,
        website: req.body.website,
        address: req.body.address,
        categories: req.body.categories,
        tags: req.body.tags || [],
        notes: req.body.notes,
      },
      { new: true }
    );
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cards/:id - Delete card
router.delete('/:id', async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const filePath = path.join(__dirname, '../../uploads', path.basename(card.imageUrl));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
