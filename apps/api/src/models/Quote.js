import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: String, default: null },
    source: { type: String, default: null },
  },
  { timestamps: true }
);

quoteSchema.index({ _id: 1 });

export default mongoose.model('Quote', quoteSchema);
