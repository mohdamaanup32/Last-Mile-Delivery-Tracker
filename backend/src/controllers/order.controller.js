const prisma = require('../utils/prisma');
const { calculateRate } = require('../services/rateEngine.service');
const { autoAssignAgent } = require('../services/assignment.service');
const { sendStatusNotification } = require('../services/email.service');

// ── HELPERS ─────────────────────────────────────────────────────────────────

const logTracking = async (orderId, status, actorId, actorRole, note = null) => {
  return prisma.trackingLog.create({
    data: { orderId, status, actorId, actorRole, note },
  });
};

const notifyCustomer = async (order, status, note = null, rescheduledDate = null) => {
  const customer = await prisma.user.findUnique({ where: { id: order.customerId } });
  if (customer?.email) {
    await sendStatusNotification({
      to: customer.email,
      customerName: customer.name,
      orderId: order.id,
      status,
      note,
      rescheduledDate,
    });
  }
};

// ── CONTROLLERS ──────────────────────────────────────────────────────────────

// Preview charge before order is placed
const previewCharge = async (req, res) => {
  try {
    const { pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType } = req.body;
    const result = await calculateRate({ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create order (customer or admin on behalf of customer)
const createOrder = async (req, res) => {
  try {
    const {
      pickupAddress, pickupPincode,
      dropAddress, dropPincode,
      length, breadth, height,
      actualWeight, orderType, paymentType,
      customerId, // only used by admin
    } = req.body;

    const actorId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Determine customer
    const resolvedCustomerId = isAdmin && customerId ? customerId : actorId;

    // Calculate rate
    const {
      pickupZone, dropZone, isIntraZone,
      volumetricWeight, chargeableWeight,
      baseCharge, codSurcharge, totalCharge,
    } = await calculateRate({ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType });

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: resolvedCustomerId,
        createdById: isAdmin ? actorId : null,
        pickupAddress, pickupPincode,
        dropAddress, dropPincode,
        length, breadth, height,
        actualWeight,
        volumetricWeight,
        chargeableWeight,
        orderType, paymentType,
        pickupZoneId: pickupZone.id,
        dropZoneId: dropZone.id,
        isIntraZone,
        baseCharge, codSurcharge, totalCharge,
        status: 'CONFIRMED',
      },
    });

    // Log tracking
    await logTracking(order.id, 'CONFIRMED', actorId, req.user.role, 'Order placed and confirmed');

    // Send notification
    await notifyCustomer(order, 'CONFIRMED');

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get orders (role-based)
const getOrders = async (req, res) => {
  try {
    const { status, zoneId, agentId } = req.query;
    const where = {};

    if (req.user.role === 'CUSTOMER') where.customerId = req.user.id;
    if (req.user.role === 'AGENT') {
      const agent = await prisma.agent.findUnique({ where: { userId: req.user.id } });
      if (!agent) return res.json([]);
      where.agentId = agent.id;
    }

    if (status) where.status = status;
    if (zoneId) where.pickupZoneId = zoneId;
    if (agentId && req.user.role === 'ADMIN') where.agentId = agentId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        agent: { include: { user: { select: { name: true, email: true } } } },
        pickupZone: true,
        dropZone: true,
        trackingLogs: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        agent: { include: { user: { select: { name: true, email: true, phone: true } } } },
        pickupZone: true,
        dropZone: true,
        trackingLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Auth check
    if (req.user.role === 'CUSTOMER' && order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manual agent assignment (admin)
const assignAgent = async (req, res) => {
  try {
    const { agentId } = req.body;
    const { id: orderId } = req.params;

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    if (!agent.isAvailable) return res.status(400).json({ error: 'Agent is not available' });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { agentId, status: 'ASSIGNED' },
    });

    await prisma.agent.update({ where: { id: agentId }, data: { isAvailable: false } });
    await logTracking(orderId, 'ASSIGNED', req.user.id, 'ADMIN', `Manually assigned to agent ${agentId}`);
    await notifyCustomer(order, 'ASSIGNED');

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Auto-assign (admin trigger)
const triggerAutoAssign = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const agent = await autoAssignAgent(orderId, order.pickupZoneId);
    if (!agent) return res.status(400).json({ error: 'No available agents found' });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { agentId: agent.id, status: 'ASSIGNED' },
    });

    await prisma.agent.update({ where: { id: agent.id }, data: { isAvailable: false } });
    await logTracking(orderId, 'ASSIGNED', req.user.id, 'ADMIN', `Auto-assigned to agent ${agent.id}`);
    await notifyCustomer(updated, 'ASSIGNED');

    res.json({ order: updated, agent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// VALID status transitions
const VALID_TRANSITIONS = {
  CONFIRMED: ['ASSIGNED'],
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  FAILED: ['RESCHEDULED'],
  RESCHEDULED: ['ASSIGNED'],
  DELIVERED: [],
};

// Update order status (agent or admin)
const updateStatus = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { status, note, failureReason, rescheduledDate } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { agent: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Agent can only update their own orders
    if (req.user.role === 'AGENT') {
      const agent = await prisma.agent.findUnique({ where: { userId: req.user.id } });
      if (!agent || order.agentId !== agent.id) {
        return res.status(403).json({ error: 'Not your order' });
      }
    }

    // Validate transition (skip for admin override)
    if (req.user.role !== 'ADMIN') {
      const allowed = VALID_TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
        });
      }
    }

    // Build update data
    const updateData = { status };
    if (failureReason) updateData.failureReason = failureReason;
    if (rescheduledDate) updateData.rescheduledDate = new Date(rescheduledDate);

    // On DELIVERED or FAILED, free the agent
    if (['DELIVERED', 'FAILED'].includes(status) && order.agentId) {
      await prisma.agent.update({ where: { id: order.agentId }, data: { isAvailable: true } });
    }

    // On RESCHEDULED, re-trigger auto-assign
    if (status === 'RESCHEDULED') {
      const newAgent = await autoAssignAgent(orderId, order.pickupZoneId);
      if (newAgent) {
        updateData.agentId = newAgent.id;
        await prisma.agent.update({ where: { id: newAgent.id }, data: { isAvailable: false } });
        await logTracking(orderId, 'ASSIGNED', req.user.id, req.user.role, `Re-assigned after reschedule to agent ${newAgent.id}`);
      }
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Immutable log
    await logTracking(orderId, status, req.user.id, req.user.role, note || failureReason || null);

    // Notify customer
    await notifyCustomer(updated, status, note, rescheduledDate ? new Date(rescheduledDate) : null);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Customer reschedule after failed delivery
const rescheduleOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { rescheduledDate } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (order.status !== 'FAILED') return res.status(400).json({ error: 'Order must be in FAILED status to reschedule' });

    const newAgent = await autoAssignAgent(orderId, order.pickupZoneId);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'RESCHEDULED',
        rescheduledDate: new Date(rescheduledDate),
        agentId: newAgent ? newAgent.id : order.agentId,
      },
    });

    if (newAgent) {
      await prisma.agent.update({ where: { id: newAgent.id }, data: { isAvailable: false } });
    }

    await logTracking(orderId, 'RESCHEDULED', req.user.id, 'CUSTOMER', `Rescheduled for ${rescheduledDate}`);
    await notifyCustomer(updated, 'RESCHEDULED', null, new Date(rescheduledDate));

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  previewCharge, createOrder, getOrders, getOrder,
  assignAgent, triggerAutoAssign, updateStatus, rescheduleOrder,
};
