import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['user', 'l2_admin', 'admin', 'super_admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user', enum: ROLES },
    /** For l2_admin: only these book categories are allowed to manage. Empty = none. */
    allowedCategories: { type: [String], default: [] },
    /** Mobile number for admin visibility and notifications */
    mobile: { type: String, default: null },
    /** If true, user can borrow more than 2 copies of same book (super_admin can set) */
    allowExtraCopies: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

export const USER_ROLES = Object.freeze({ user: 'user', l2_admin: 'l2_admin', admin: 'admin', super_admin: 'super_admin' });

export default mongoose.model('User', userSchema);
