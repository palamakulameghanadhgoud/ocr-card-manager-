import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    name: { type: String, default: '' },
    company: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    categories: {
      industry: { type: String, default: '' },
      relationshipType: { type: String, default: '' },
      priority: { type: String, default: '' },
    },
    tags: [{ type: String }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes for search and filtering
cardSchema.index({ name: 'text', company: 'text', jobTitle: 'text', tags: 'text' });
cardSchema.index({ 'categories.industry': 1, 'categories.relationshipType': 1, 'categories.priority': 1 });
cardSchema.index({ createdAt: -1 });

export default mongoose.model('Card', cardSchema);
