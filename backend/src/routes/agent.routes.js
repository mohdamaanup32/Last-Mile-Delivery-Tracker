const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin: Create agent (creates user + agent profile)
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, phone, zoneId } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name, email, phone,
        password: hashed,
        role: 'AGENT',
        agent: { create: { zoneId, isAvailable: true } },
      },
      include: { agent: true },
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all agents (admin)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        zone: true,
        orders: { select: { id: true, status: true } },
      },
    });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent: Update own location
router.patch('/location', authenticate, authorize('AGENT'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const agent = await prisma.agent.update({
      where: { userId: req.user.id },
      data: { latitude, longitude },
    });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent: Toggle availability
router.patch('/availability', authenticate, authorize('AGENT'), async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const agent = await prisma.agent.update({
      where: { userId: req.user.id },
      data: { isAvailable },
    });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update agent zone
router.patch('/:id/zone', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { zoneId } = req.body;
    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: { zoneId },
    });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
