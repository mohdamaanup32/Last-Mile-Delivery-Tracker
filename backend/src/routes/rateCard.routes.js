const express = require('express');
const router = express.Router();
const { upsertRateCard, getRateCards, getRateCardsByZone, deleteRateCard } = require('../controllers/rateCard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getRateCards);
router.get('/zone/:zoneId', getRateCardsByZone);
router.post('/', authorize('ADMIN'), upsertRateCard);
router.delete('/:id', authorize('ADMIN'), deleteRateCard);

module.exports = router;
