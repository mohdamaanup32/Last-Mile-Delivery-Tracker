const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (order matters due to FK constraints)
  await prisma.trackingLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.area.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();

  // ── Zones ──
  const zoneNorth = await prisma.zone.create({ data: { name: 'North Delhi' } });
  const zoneSouth = await prisma.zone.create({ data: { name: 'South Delhi' } });
  const zoneGurugram = await prisma.zone.create({ data: { name: 'Gurugram' } });
  const zoneNoida = await prisma.zone.create({ data: { name: 'Noida' } });

  // ── Areas (pincodes mapped to zones) ──
  await prisma.area.createMany({
    data: [
      { pincode: '110001', city: 'New Delhi', state: 'Delhi', zoneId: zoneNorth.id },
      { pincode: '110006', city: 'New Delhi', state: 'Delhi', zoneId: zoneNorth.id },
      { pincode: '110009', city: 'New Delhi', state: 'Delhi', zoneId: zoneNorth.id },
      { pincode: '110017', city: 'New Delhi', state: 'Delhi', zoneId: zoneSouth.id },
      { pincode: '110019', city: 'New Delhi', state: 'Delhi', zoneId: zoneSouth.id },
      { pincode: '110025', city: 'New Delhi', state: 'Delhi', zoneId: zoneSouth.id },
      { pincode: '122001', city: 'Gurugram', state: 'Haryana', zoneId: zoneGurugram.id },
      { pincode: '122018', city: 'Gurugram', state: 'Haryana', zoneId: zoneGurugram.id },
      { pincode: '122022', city: 'Gurugram', state: 'Haryana', zoneId: zoneGurugram.id },
      { pincode: '201301', city: 'Noida', state: 'Uttar Pradesh', zoneId: zoneNoida.id },
      { pincode: '201304', city: 'Noida', state: 'Uttar Pradesh', zoneId: zoneNoida.id },
    ],
  });

  // ── Rate Cards (intra & inter zone, B2B & B2C) ──
  const zones = [zoneNorth, zoneSouth, zoneGurugram, zoneNoida];
  for (const zone of zones) {
    await prisma.rateCard.createMany({
      data: [
        { zoneId: zone.id, orderType: 'B2C', isIntraZone: true, baseRate: 25, codSurcharge: 30 },
        { zoneId: zone.id, orderType: 'B2C', isIntraZone: false, baseRate: 40, codSurcharge: 40 },
        { zoneId: zone.id, orderType: 'B2B', isIntraZone: true, baseRate: 18, codSurcharge: 20 },
        { zoneId: zone.id, orderType: 'B2B', isIntraZone: false, baseRate: 30, codSurcharge: 25 },
      ],
    });
  }

  // ── Users ──
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@lastmile.com', password: hashedPassword, role: 'ADMIN', phone: '9999900000' },
  });

  const customer = await prisma.user.create({
    data: { name: 'Rahul Sharma', email: 'customer@lastmile.com', password: hashedPassword, role: 'CUSTOMER', phone: '9999911111' },
  });

  // ── Agents ──
  const agentUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Vikram Singh', email: 'agent1@lastmile.com', password: hashedPassword, role: 'AGENT', phone: '9999922222',
        agent: { create: { zoneId: zoneNorth.id, isAvailable: true, latitude: 28.6519, longitude: 77.2315 } },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Amit Kumar', email: 'agent2@lastmile.com', password: hashedPassword, role: 'AGENT', phone: '9999933333',
        agent: { create: { zoneId: zoneSouth.id, isAvailable: true, latitude: 28.5494, longitude: 77.2502 } },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Priya Verma', email: 'agent3@lastmile.com', password: hashedPassword, role: 'AGENT', phone: '9999944444',
        agent: { create: { zoneId: zoneGurugram.id, isAvailable: true, latitude: 28.4595, longitude: 77.0266 } },
      },
    }),
  ]);

  console.log('✅ Seed complete!');
  console.log('');
  console.log('── Login Credentials (password: Password123!) ──');
  console.log('Admin:    admin@lastmile.com');
  console.log('Customer: customer@lastmile.com');
  console.log('Agent 1:  agent1@lastmile.com (North Delhi)');
  console.log('Agent 2:  agent2@lastmile.com (South Delhi)');
  console.log('Agent 3:  agent3@lastmile.com (Gurugram)');
  console.log('');
  console.log('Sample pincodes: 110001 (North), 110017 (South), 122001 (Gurugram), 201301 (Noida)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
