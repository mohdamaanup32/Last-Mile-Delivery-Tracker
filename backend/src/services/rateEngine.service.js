const prisma = require('../utils/prisma');
const { detectZoneByPincode } = require('../controllers/zone.controller');

/**
 * RATE CALCULATION ENGINE
 * 
 * Logic:
 * 1. Detect pickup zone from pickupPincode
 * 2. Detect drop zone from dropPincode
 * 3. Determine if intra-zone (same zone) or inter-zone
 * 4. Compute volumetric weight = (L × B × H) / 5000
 * 5. Chargeable weight = max(actualWeight, volumetricWeight)
 * 6. Lookup rate card by (pickupZone, orderType, isIntraZone)
 * 7. baseCharge = chargeableWeight × baseRate
 * 8. If COD: add codSurcharge from rate card
 * 9. totalCharge = baseCharge + codSurcharge
 */

const calculateRate = async ({ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType }) => {
  // Step 1 & 2: Zone detection
  const pickupZone = await detectZoneByPincode(pickupPincode);
  const dropZone = await detectZoneByPincode(dropPincode);

  if (!pickupZone) throw new Error(`No zone found for pickup pincode: ${pickupPincode}`);
  if (!dropZone) throw new Error(`No zone found for drop pincode: ${dropPincode}`);

  // Step 3: Intra vs inter zone
  const isIntraZone = pickupZone.id === dropZone.id;

  // Step 4: Volumetric weight
  const volumetricWeight = (length * breadth * height) / 5000;

  // Step 5: Chargeable weight
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  // Step 6: Rate card lookup
  const rateCard = await prisma.rateCard.findUnique({
    where: {
      zoneId_orderType_isIntraZone: {
        zoneId: pickupZone.id,
        orderType,
        isIntraZone,
      }
    }
  });

  if (!rateCard) {
    throw new Error(
      `No rate card configured for zone "${pickupZone.name}", type ${orderType}, ${isIntraZone ? 'intra' : 'inter'}-zone. Please contact admin.`
    );
  }

  // Step 7: Base charge
  const baseCharge = parseFloat((chargeableWeight * rateCard.baseRate).toFixed(2));

  // Step 8: COD surcharge
  const codSurcharge = paymentType === 'COD' ? rateCard.codSurcharge : 0;

  // Step 9: Total
  const totalCharge = parseFloat((baseCharge + codSurcharge).toFixed(2));

  return {
    pickupZone,
    dropZone,
    isIntraZone,
    volumetricWeight: parseFloat(volumetricWeight.toFixed(3)),
    chargeableWeight: parseFloat(chargeableWeight.toFixed(3)),
    baseCharge,
    codSurcharge,
    totalCharge,
    rateCard,
  };
};

module.exports = { calculateRate };
