const express = require('express');
const router = express.Router();
const { createZone, getZones, addArea, removeArea } = require('../controllers/zone.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getZones);
router.post('/', authorize('ADMIN'), createZone);
router.post('/:zoneId/areas', authorize('ADMIN'), addArea);
router.delete('/areas/:areaId', authorize('ADMIN'), removeArea);

module.exports = router;
