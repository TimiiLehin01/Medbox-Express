/**
 * Demo data for MedBox Express.
 *
 *   npm run seed:demo             create or refresh demo data (safe to re-run)
 *   npm run seed:demo -- --clear  remove everything this script created
 *
 * Everything it creates uses an email ending in @medbox.demo, so it is easy to
 * tell apart from real accounts. The pharmacy names, addresses and phone
 * numbers are made up, and the coordinates are approximate points around
 * Ondo town. Demo accounts get a random password nobody knows; they are only
 * reachable through the server-side demo login (see app/api/auth/demo).
 */
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DEMO_DOMAIN = "@medbox.demo";

// ---------- catalogue (category names match the "add product" form) ----------
const CATALOG = [
  // Pain Relief
  ["Paracetamol 500mg (20 tablets)", "Pain Relief", 500, false, "Relieves mild to moderate pain and reduces fever."],
  ["Ibuprofen 400mg (10 tablets)", "Pain Relief", 800, false, "Anti-inflammatory for headache, muscle and period pain. Take with food."],
  ["Diclofenac Gel 30g", "Pain Relief", 1800, false, "Topical gel for joint and muscle pain."],
  ["Mefenamic Acid 500mg (10 capsules)", "Pain Relief", 900, false, "For toothache and period pain."],
  // Antibiotics (prescription)
  ["Amoxicillin 500mg (21 capsules)", "Antibiotics", 2500, true, "Broad-spectrum antibiotic. Complete the full course."],
  ["Ciprofloxacin 500mg (10 tablets)", "Antibiotics", 3000, true, "Antibiotic for urinary and respiratory infections."],
  ["Metronidazole 400mg (21 tablets)", "Antibiotics", 1200, true, "For bacterial and parasitic infections. Avoid alcohol."],
  ["Azithromycin 500mg (3 tablets)", "Antibiotics", 3500, true, "Short-course antibiotic."],
  ["Cotrimoxazole 960mg (10 tablets)", "Antibiotics", 1500, true, "Antibiotic for a range of bacterial infections."],
  // Vitamins
  ["Vitamin C 1000mg (20 effervescent tablets)", "Vitamins", 2500, false, "Daily immune support."],
  ["Multivitamin (30 capsules)", "Vitamins", 3500, false, "Daily multivitamin and mineral supplement."],
  ["Zinc 20mg (30 tablets)", "Vitamins", 1500, false, "Supports immunity and recovery."],
  ["Vitamin D3 1000IU (60 capsules)", "Vitamins", 3000, false, "Supports bone and immune health."],
  ["Folic Acid 5mg (28 tablets)", "Vitamins", 800, false, "Recommended in pregnancy."],
  // Cold & Flu
  ["Cough Syrup 100ml", "Cold & Flu", 1800, false, "Soothes dry and chesty coughs."],
  ["Loratadine 10mg (10 tablets)", "Cold & Flu", 1200, false, "Non-drowsy allergy relief."],
  ["Cetirizine 10mg (10 tablets)", "Cold & Flu", 900, false, "Relief from hay fever and allergies."],
  ["Nasal Decongestant Spray 15ml", "Cold & Flu", 2200, false, "Clears a blocked nose."],
  ["Throat Lozenges (16 pieces)", "Cold & Flu", 700, false, "Soothes a sore throat."],
  // Diabetes
  ["Blood Glucose Test Strips (50)", "Diabetes", 6500, false, "Compatible with common home glucometers."],
  ["Metformin 500mg (30 tablets)", "Diabetes", 1800, true, "Type 2 diabetes management."],
  ["Glibenclamide 5mg (30 tablets)", "Diabetes", 1500, true, "Helps lower blood sugar."],
  // Heart
  ["Amlodipine 5mg (30 tablets)", "Heart", 2000, true, "Blood pressure medication."],
  ["Lisinopril 10mg (30 tablets)", "Heart", 2200, true, "Blood pressure and heart protection."],
  ["Aspirin 75mg (28 tablets)", "Heart", 900, false, "Low-dose aspirin."],
  ["Digital Blood Pressure Monitor", "Heart", 18000, false, "Upper-arm automatic monitor."],
  // Digestive
  ["ORS Sachets (10)", "Digestive", 300, false, "Oral rehydration salts for diarrhoea."],
  ["Antacid Suspension 200ml", "Digestive", 1500, false, "Relief from heartburn and indigestion."],
  ["Loperamide 2mg (6 capsules)", "Digestive", 800, false, "Short-term relief from diarrhoea."],
  ["Omeprazole 20mg (14 capsules)", "Digestive", 2000, false, "Reduces stomach acid."],
  // Skin Care
  ["Hydrocortisone Cream 1% 15g", "Skin Care", 1800, false, "For itching and mild skin inflammation."],
  ["Clotrimazole Cream 20g", "Skin Care", 1500, false, "Antifungal cream."],
  ["Calamine Lotion 100ml", "Skin Care", 1200, false, "Soothes itching and irritation."],
  ["Sunscreen SPF 50 (60ml)", "Skin Care", 6500, false, "Broad-spectrum sun protection."],
  // First Aid
  ["Adhesive Plasters (20)", "First Aid", 700, false, "Assorted sizes."],
  ["Elastic Bandage 7.5cm", "First Aid", 1200, false, "Support for sprains and strains."],
  ["Antiseptic Liquid 500ml", "First Aid", 2200, false, "For cleaning wounds and surfaces."],
  ["Digital Thermometer", "First Aid", 3500, false, "Fast, accurate temperature readings."],
  ["Disposable Gloves (box of 100)", "First Aid", 4500, false, "Powder-free."],
  // Other
  ["Artemether/Lumefantrine 80/480mg (6 tablets)", "Other", 2800, false, "Treatment for uncomplicated malaria. Follow the dosing leaflet."],
  ["Hand Sanitizer 500ml", "Other", 2000, false, "70% alcohol."],
  ["Face Masks (box of 50)", "Other", 2500, false, "3-ply disposable masks."],
];

// ---------- pharmacies (fictional, around Ondo town) ----------
const PHARMACIES = [
  { slug: "greenleaf", email: "demo-pharmacy@medbox.demo", name: "Greenleaf Pharmacy", address: "12 Yaba Road, Yaba, Ondo town, Ondo State", lat: 7.0985, lng: 4.8402, open: "07:30", close: "22:00", verified: true, phone: "08000000101", range: [28, 40], reviews: [[5, "Quick service and everything was in stock."], [4, "Fair prices, friendly pharmacist."]] },
  { slug: "healthpoint", name: "HealthPoint Pharmacy & Stores", address: "4 Fiwasaye Street, Fiwasaye, Ondo town, Ondo State", lat: 7.0881, lng: 4.8449, open: "08:00", close: "21:00", verified: true, phone: "08000000102", range: [26, 38], reviews: [[5, "Clean shop and very helpful staff."], [4, "Delivery was fast."], [4, "Good range of products."]] },
  { slug: "sunrise", name: "Sunrise Care Pharmacy", address: "27 Odojomu Road, Odojomu, Ondo town, Ondo State", lat: 7.1052, lng: 4.8266, open: "00:00", close: "23:59", verified: true, phone: "08000000103", range: [22, 34], reviews: [[5, "Open all night. A lifesaver when my child had a fever."], [4, "Reasonable prices."]] },
  { slug: "lifeline", name: "Lifeline Chemist", address: "9 Sabo Market Road, Sabo, Ondo town, Ondo State", lat: 7.0793, lng: 4.8301, open: "08:30", close: "20:00", verified: true, phone: "08000000104", range: [20, 30], reviews: [[4, "Got my prescription filled without any stress."]] },
  { slug: "unity", name: "Unity Wellness Pharmacy", address: "31 Oke-Ogba Road, Oke-Ogba, Ondo town, Ondo State", lat: 7.115, lng: 4.8512, open: "09:00", close: "19:00", verified: true, phone: "08000000105", range: [18, 28], reviews: [[3, "Okay, but a few items were out of stock."], [5, "Great advice from the pharmacist."]] },
  { slug: "careplus", name: "CarePlus Pharmacy", address: "15 Bolorunduro Road, Ondo town, Ondo State", lat: 7.0701, lng: 4.8189, open: "08:00", close: "20:30", verified: false, phone: "08000000106", range: [14, 22], reviews: [] },
];

const EXTRA_ACCOUNTS = [
  { email: "demo-consumer@medbox.demo", name: "Demo Consumer", phone: "08000000001", role: "CONSUMER" },
  { email: "demo-rider@medbox.demo", name: "Demo Rider", phone: "08000000002", role: "RIDER" },
  { email: "demo-admin@medbox.demo", name: "Demo Admin", phone: "08000000003", role: "ADMIN" },
];

// ---------- helpers ----------
function rng(seed) {
  // small deterministic PRNG so re-runs produce the same shop contents
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const roundTo50 = (n) => Math.max(50, Math.round(n / 50) * 50);
const randomPasswordHash = () => bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);

async function upsertUser({ email, name, phone, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { email },
      data: { name, role, status: "ACTIVE" },
    });
  }
  return prisma.user.create({
    data: { email, name, phone, role, status: "ACTIVE", password: await randomPasswordHash() },
  });
}

async function clearDemo() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
    select: { id: true, pharmacy: { select: { id: true } }, rider: { select: { id: true } } },
  });
  const userIds = users.map((u) => u.id);
  const pharmacyIds = users.map((u) => u.pharmacy?.id).filter(Boolean);
  const riderIds = users.map((u) => u.rider?.id).filter(Boolean);

  // Orders reference users, pharmacies and riders without cascade, so remove them first.
  await prisma.order.deleteMany({
    where: {
      OR: [
        { consumerId: { in: userIds } },
        { pharmacyId: { in: pharmacyIds } },
        { riderId: { in: riderIds } },
      ],
    },
  });
  await prisma.review.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { pharmacyId: { in: pharmacyIds } }] },
  });
  await prisma.riderEarning.deleteMany({ where: { riderId: { in: riderIds } } });
  const res = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  console.log(`Removed ${res.count} demo users (and their pharmacies, products and orders).`);
}

async function seed() {
  const consumer = await upsertUser(EXTRA_ACCOUNTS[0]);

  for (const [index, p] of PHARMACIES.entries()) {
    const user = await upsertUser({
      email: p.email || `demo-${p.slug}${DEMO_DOMAIN}`,
      name: p.name,
      phone: p.phone,
      role: "PHARMACY",
    });

    const pharmacy = await prisma.pharmacy.upsert({
      where: { userId: user.id },
      create: { userId: user.id, name: p.name, address: p.address, latitude: p.lat, longitude: p.lng, openTime: p.open, closeTime: p.close, verified: p.verified, deliveryRadius: 10 },
      update: { name: p.name, address: p.address, latitude: p.lat, longitude: p.lng, openTime: p.open, closeTime: p.close, verified: p.verified },
    });

    // Each pharmacy stocks a different slice of the catalogue at slightly different prices.
    const random = rng(1000 + index * 97);
    const count = p.range[0] + Math.floor(random() * (p.range[1] - p.range[0] + 1));
    const picked = [...CATALOG].sort(() => random() - 0.5).slice(0, count);
    const priceFactor = 0.92 + random() * 0.2;

    for (const [name, category, basePrice, rx, description] of picked) {
      const price = roundTo50(basePrice * (priceFactor + (random() - 0.5) * 0.08));
      const roll = random();
      const quantity = roll < 0.06 ? 0 : roll < 0.2 ? 3 + Math.floor(random() * 8) : 20 + Math.floor(random() * 120);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 8 + Math.floor(random() * 22));

      const data = { name, description, category, price, quantity, expiryDate, prescriptionRequired: rx };
      const existing = await prisma.product.findFirst({ where: { pharmacyId: pharmacy.id, name } });
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
      } else {
        await prisma.product.create({ data: { ...data, pharmacyId: pharmacy.id } });
      }
    }

    // A few reviews from the demo consumer so ratings are not empty.
    await prisma.review.deleteMany({ where: { pharmacyId: pharmacy.id, userId: consumer.id } });
    for (const [rating, comment] of p.reviews) {
      await prisma.review.create({ data: { userId: consumer.id, pharmacyId: pharmacy.id, rating, comment } });
    }

    console.log(`  ${p.name}: ${picked.length} products${p.verified ? "" : " (unverified)"}`);
  }

  const riderUser = await upsertUser(EXTRA_ACCOUNTS[1]);
  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    create: { userId: riderUser.id, transportType: "Motorcycle", verified: true, availability: "AVAILABLE", latitude: 7.0936, longitude: 4.8354 },
    update: { transportType: "Motorcycle", verified: true },
  });

  await upsertUser(EXTRA_ACCOUNTS[2]);
  console.log("Demo data is ready.");
}

async function main() {
  if (process.argv.includes("--clear")) await clearDemo();
  else {
    console.log("Seeding demo pharmacies around Ondo town...");
    await seed();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
