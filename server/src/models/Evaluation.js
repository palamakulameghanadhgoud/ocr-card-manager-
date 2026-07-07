import mongoose from 'mongoose';

const EvaluationSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String },
  fileSize: { type: Number },
  ocrBackend: { type: String },
  graderProvider: { type: String },
  pages: { type: Number, default: 0 },
  extractedText: { type: String, default: '' },
  answerKey: { type: mongoose.Schema.Types.Mixed, default: {} },
  perQuestion: [{ type: mongoose.Schema.Types.Mixed }],
  totalAwarded: { type: Number, default: 0 },
  totalMax: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

EvaluationSchema.index({ createdAt: -1 });

export default mongoose.models.Evaluation || mongoose.model('Evaluation', EvaluationSchema);