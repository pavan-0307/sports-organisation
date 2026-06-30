import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  listUsers,
  updateUserRole,
  updateUserStatus,
  getCurrentUser
} from '../controllers/user.controller.js';

const router: Router = Router();

router.get('/', authenticateJWT, authorizeRoles('admin', 'super_admin'), listUsers);
router.get('/me', authenticateJWT, getCurrentUser);
router.put('/:id/role', authenticateJWT, authorizeRoles('super_admin'), updateUserRole);
router.put('/:id/status', authenticateJWT, authorizeRoles('admin', 'super_admin'), updateUserStatus);

export default router;
