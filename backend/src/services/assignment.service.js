const prisma = require('../utils/prisma');

/**
 * AUTO-ASSIGNMENT LOGIC
 * 
 * Priority:
 * 1. Find available agents in the pickup zone
 * 2. If agent has lat/lng, pick the geographically nearest one
 * 3. If no lat/lng data, pick any available agent in the zone (round-robin style - least recently assigned)
 * 4. If no agent in pickup zone, expand to any available agent
 */

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const autoAssignAgent = async (orderId, pickupZoneId, pickupLat = null, pickupLng = null) => {
  // Find available agents in pickup zone
  let agents = await prisma.agent.findMany({
    where: { isAvailable: true, zoneId: pickupZoneId },
    include: { user: true },
  });

  // Fallback: any available agent
  if (agents.length === 0) {
    agents = await prisma.agent.findMany({
      where: { isAvailable: true },
      include: { user: true },
      orderBy: { orders: { _count: 'asc' } }, // least busy
    });
  }

  if (agents.length === 0) return null;

  let selectedAgent = agents[0];

  // If coordinates available, find nearest
  if (pickupLat && pickupLng) {
    const agentsWithDistance = agents
      .filter(a => a.latitude && a.longitude)
      .map(a => ({
        ...a,
        distance: haversineDistance(pickupLat, pickupLng, a.latitude, a.longitude),
      }));

    if (agentsWithDistance.length > 0) {
      agentsWithDistance.sort((a, b) => a.distance - b.distance);
      selectedAgent = agentsWithDistance[0];
    }
  }

  return selectedAgent;
};

module.exports = { autoAssignAgent };
