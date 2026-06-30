import { Router } from 'express';
import {
  register,
  requestOtp,
  verifyOtp,
  refresh,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { getCurrentUser } from '../controllers/user.controller.js';

const router: Router = Router();

router.post('/register', register);
router.post('/login/otp-request', requestOtp);
router.post('/login/verify', verifyOtp);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
