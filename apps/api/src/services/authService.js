import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/index.js';

function toUserResponse(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name,
    email: o.email,
    role: o.role,
    mobile: o.mobile || null,
    allowedCategories: Array.isArray(o.allowedCategories) ? o.allowedCategories : [],
  };
}

export async function register(name, email, password, mobile) {
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: 'user',
    mobile: mobile ? String(mobile).trim() : null,
  });
  return toUserResponse(user);
}

/** Login with email or mobile (finds user by either). */
export async function login(emailOrMobile, password) {
  const value = (emailOrMobile || '').trim();
  if (!value) return null;
  const user = await User.findOne({
    $or: [{ email: value }, { mobile: value }],
  }).select('name email mobile password role allowedCategories').lean();
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  const id = String(user._id);
  const token = jwt.sign(
    { id, email: user.email, role: user.role, allowedCategories: user.allowedCategories || [] },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  return {
    user: {
      id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || null,
      role: user.role,
      allowedCategories: user.allowedCategories || [],
    },
    token,
  };
}
