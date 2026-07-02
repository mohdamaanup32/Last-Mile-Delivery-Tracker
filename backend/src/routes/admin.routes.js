const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('ADMIN'));

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalOrders, byStatus, totalAgents, availableAgents, totalCustomers] = await Promise.all([
      prisma.order.count(),
      prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.agent.count(),
      prisma.agent.count({ where: { isAvailable: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);

    const statusBreakdown = byStatus.reduce((acc, s) => {
      acc[s.status] = s._count.status;
      return acc;
    }, {});

    res.json({
      totalOrders,
      statusBreakdown,
      totalAgents,
      availableAgents,
      busyAgents: totalAgents - availableAgents,
      totalCustomers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all customers (for admin to create order on behalf of)
router.get('/customers', async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force override order status (no transition validation, bypasses normal flow)
router.patch('/orders/:id/override', async (req, res) => {
  try {
    const { status, note } = req.body;
    const { id: orderId } = req.params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    await prisma.trackingLog.create({
      data: {
        orderId,
        status,
        actorId: req.user.id,
        actorRole: 'ADMIN',
        note: note || 'Admin override',
      },
    });

    // Free up agent if terminal status
    if (['DELIVERED', 'FAILED'].includes(status) && order.agentId) {
      await prisma.agent.update({ where: { id: order.agentId }, data: { isAvailable: true } });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
