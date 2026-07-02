const express = require('express');
const router = express.Router();
const {
  previewCharge, createOrder, getOrders, getOrder,
  assignAgent, triggerAutoAssign, updateStatus, rescheduleOrder,
} = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/preview-charge', previewCharge);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);

// Assignment (admin only)
router.post('/:id/assign', authorize('ADMIN'), assignAgent);
router.post('/:id/auto-assign', authorize('ADMIN'), triggerAutoAssign);

// Status update (agent + admin)
router.patch('/:id/status', authorize('AGENT', 'ADMIN'), updateStatus);

// Reschedule (customer)
router.post('/:id/reschedule', authorize('CUSTOMER'), rescheduleOrder);

module.exports = router;
