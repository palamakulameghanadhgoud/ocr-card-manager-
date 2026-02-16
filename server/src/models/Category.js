import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['industry', 'relationshipType', 'priority'],
      required: true,
    },
    value: { type: String, required: true },
    label: { type: String, required: true },
  },
  { timestamps: true }
);

categorySchema.index({ type: 1, value: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
