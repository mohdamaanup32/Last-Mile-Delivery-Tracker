const prisma = require('../utils/prisma');

// Create zone
const createZone = async (req, res) => {
  try {
    const { name } = req.body;
    const zone = await prisma.zone.create({ data: { name } });
    res.status(201).json(zone);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Zone name already exists' });
    res.status(500).json({ error: err.message });
  }
};

// Get all zones with areas
const getZones = async (req, res) => {
  try {
    const zones = await prisma.zone.findMany({ include: { areas: true } });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add area (pincode) to zone
const addArea = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { pincode, city, state } = req.body;

    const area = await prisma.area.create({
      data: { pincode, city, state, zoneId },
    });
    res.status(201).json(area);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Pincode already assigned to a zone' });
    res.status(500).json({ error: err.message });
  }
};

// Remove area
const removeArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    await prisma.area.delete({ where: { id: areaId } });
    res.json({ message: 'Area removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Detect zone from pincode (utility used by order engine)
const detectZoneByPincode = async (pincode) => {
  const area = await prisma.area.findUnique({
    where: { pincode },
    include: { zone: true },
  });
  return area ? area.zone : null;
};

module.exports = { createZone, getZones, addArea, removeArea, detectZoneByPincode };
