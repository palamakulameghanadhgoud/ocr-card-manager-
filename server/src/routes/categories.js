import express from 'express';
import Category from '../models/Category.js';

const router = express.Router();

// Seed default categories if empty
const defaultCategories = [
  { type: 'industry', value: 'technology', label: 'Technology' },
  { type: 'industry', value: 'healthcare', label: 'Healthcare' },
  { type: 'industry', value: 'finance', label: 'Finance' },
  { type: 'industry', value: 'education', label: 'Education' },
  { type: 'industry', value: 'retail', label: 'Retail' },
  { type: 'relationshipType', value: 'client', label: 'Client' },
  { type: 'relationshipType', value: 'partner', label: 'Partner' },
  { type: 'relationshipType', value: 'vendor', label: 'Vendor' },
  { type: 'relationshipType', value: 'colleague', label: 'Colleague' },
  { type: 'priority', value: 'high', label: 'High' },
  { type: 'priority', value: 'medium', label: 'Medium' },
  { type: 'priority', value: 'low', label: 'Low' },
];

// GET /api/categories - Get all categories (alphabetically by label)
router.get('/', async (req, res) => {
  try {
    let categories = await Category.find().lean();
    if (categories.length === 0) {
      try {
        await Category.insertMany(defaultCategories);
        categories = await Category.find().lean();
      } catch {
        // MongoDB not available - return defaults so frontend still works
        categories = defaultCategories.map((c, i) => ({ ...c, _id: `fallback-${i}` }));
      }
    }
    if (categories.length === 0) {
      categories = defaultCategories.map((c, i) => ({ ...c, _id: `fallback-${i}` }));
    }
    categories.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    res.json(categories);
  } catch (error) {
    // Return defaults on DB error so frontend dropdowns work
    const fallback = defaultCategories.map((c, i) => ({ ...c, _id: `fallback-${i}` }));
    fallback.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    res.json(fallback);
  }
});

// POST /api/categories - Create category
router.post('/', async (req, res) => {
  try {
    const { type, value, label } = req.body;
    if (!type || !value || !label) {
      return res.status(400).json({ error: 'type, value, and label are required' });
    }
    const category = await Category.create({ type, value, label });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
