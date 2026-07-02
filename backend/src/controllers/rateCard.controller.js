const prisma = require('../utils/prisma');

// Create or update rate card
const upsertRateCard = async (req, res) => {
  try {
    const { zoneId, orderType, isIntraZone, baseRate, codSurcharge } = req.body;

    const rateCard = await prisma.rateCard.upsert({
      where: { zoneId_orderType_isIntraZone: { zoneId, orderType, isIntraZone } },
      update: { baseRate, codSurcharge },
      create: { zoneId, orderType, isIntraZone, baseRate, codSurcharge },
    });

    res.json(rateCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all rate cards
const getRateCards = async (req, res) => {
  try {
    const cards = await prisma.rateCard.findMany({ include: { zone: true } });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get rate cards for a zone
const getRateCardsByZone = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const cards = await prisma.rateCard.findMany({ where: { zoneId } });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete rate card
const deleteRateCard = async (req, res) => {
  try {
    await prisma.rateCard.delete({ where: { id: req.params.id } });
    res.json({ message: 'Rate card deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { upsertRateCard, getRateCards, getRateCardsByZone, deleteRateCard };
