import mongoose from 'mongoose';

/** Status flow: requested → borrowed (admin approved) → returned_pending_verify (user returned) → completed (admin verified). 'returned' = legacy, treated as completed. */
const BORROW_STATUSES = ['requested', 'borrowed', 'returned', 'returned_pending_verify', 'completed'];

const borrowRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    status: { type: String, default: 'requested', enum: BORROW_STATUSES },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    /** Fine amount (e.g. for late return). Applied when admin verifies return. */
    fineAmount: { type: Number, default: 0 },
    /** Backward compatibility: borrowDate = requestedAt or approvedAt */
    borrowDate: { type: Date, default: Date.now },
    returnDate: { type: Date, default: null },
    /** When user requests an additional copy (they already have 1). Predefined reason code. */
    extraCopyReason: { type: String, default: null },
    /** Custom reason text (e.g. when extraCopyReason is "Other"). */
    extraCopyReasonCustom: { type: String, default: null },
    /** OTP customer shows when returning book at library; admin enters to verify. Generated when borrow is approved. */
    returnOtp: { type: String, default: null },
    returnOtpGeneratedAt: { type: Date, default: null },
    /** When true, admin processed return via "special case" override (e.g. OTP lost). */
    returnSpecialCase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

borrowRecordSchema.index({ userId: 1 });
borrowRecordSchema.index({ bookId: 1 });
borrowRecordSchema.index({ status: 1 });

export const BORROW_STATUS = Object.freeze({
  requested: 'requested',
  borrowed: 'borrowed',
  returned_pending_verify: 'returned_pending_verify',
  completed: 'completed',
});

export default mongoose.model('BorrowRecord', borrowRecordSchema);
