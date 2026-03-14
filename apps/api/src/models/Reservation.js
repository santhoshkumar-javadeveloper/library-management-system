import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    status: { type: String, default: 'reserved', enum: ['reserved', 'cancelled', 'fulfilled'] },
    fulfilledAt: { type: Date, default: null },
    /** BorrowRecord id when reservation was fulfilled by admin approve */
    borrowRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRecord', default: null },
  },
  { timestamps: true }
);

reservationSchema.index({ userId: 1 });
reservationSchema.index({ bookId: 1 });
reservationSchema.index({ status: 1 });

export default mongoose.model('Reservation', reservationSchema);
