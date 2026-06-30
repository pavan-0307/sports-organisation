import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  checkAvailability,
  createRentalOrder,
  confirmPayment,
  verifyPickup,
  verifyReturn,
  listRentalOrders,
  getTimelineHistory
} from '../controllers/rental.controller.js';

const router: Router = Router();

// Customer facing routes
router.get('/rentals/availability', checkAvailability);
router.post('/rentals/order', authenticateJWT, createRentalOrder);
router.post('/rentals/payment-confirm', authenticateJWT, confirmPayment);
router.get('/rentals/history', authenticateJWT, listRentalOrders);

// Staff / Administrative verification routes
router.post('/rentals/admin/verify-pickup', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), verifyPickup);
router.post('/rentals/admin/verify-return', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), verifyReturn);
router.get('/rentals/admin/timeline/:unitId', authenticateJWT, authorizeRoles('staff', 'admin', 'super_admin'), getTimelineHistory);

export default router;
