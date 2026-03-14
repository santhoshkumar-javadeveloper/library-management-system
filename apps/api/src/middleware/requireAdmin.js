import { authMiddleware } from './auth.js';
import User from '../models/User.js';

const ADMIN_ROLES = ['admin', 'super_admin'];
const L2_OR_ABOVE = ['l2_admin', 'admin', 'super_admin'];

/** Require admin or super_admin */
export function requireAdmin(req, res, next) {
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/** Require super_admin only */
export function requireSuperAdmin(req, res, next) {
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  });
}

/** Require l2_admin, admin, or super_admin. Loads full user so req.user.allowedCategories is set for l2_admin. */
export function requireAdminOrL2(req, res, next) {
  authMiddleware(req, res, async (err) => {
    if (err) return next(err);
    if (!L2_OR_ABOVE.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Admin or L2 admin access required' });
    }
    try {
      if (req.user.role === 'l2_admin') {
        const u = await User.findById(req.user.id).select('allowedCategories').lean();
        req.user.allowedCategories = u?.allowedCategories || [];
      } else {
        req.user.allowedCategories = null; // admin/super_admin: no category limit
      }
      next();
    } catch (e) {
      next(e);
    }
  });
}
