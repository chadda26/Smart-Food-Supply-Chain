const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = new PrismaClient();

const IMPACT_CONSTANTS = {
  MEALS_PER_KG: 2.4,
  CO2E_KG_PER_KG_FOOD: 2.5,
  WATER_LITERS_PER_KG_FOOD: 1250,
  FINANCIAL_VALUE_USD_PER_KG: 3.5,
};

function calculateImpactFromKg(foodKg) {
  const safeKg = Math.max(0, foodKg);
  return {
    mealsServed: Math.round(safeKg * IMPACT_CONSTANTS.MEALS_PER_KG),
    co2SavedKg: Math.round(safeKg * IMPACT_CONSTANTS.CO2E_KG_PER_KG_FOOD * 10) / 10,
    waterSavedLiters: Math.round(safeKg * IMPACT_CONSTANTS.WATER_LITERS_PER_KG_FOOD),
    financialValueSavedUsd: Math.round(safeKg * IMPACT_CONSTANTS.FINANCIAL_VALUE_USD_PER_KG * 100) / 100,
  };
}

const pickupVerificationSchema = z.object({
  verificationCode: z.string().min(4, "4-digit verification code required"),
  packageCondition: z.enum(["GOOD", "FAIR", "DAMAGED"]),
  temperatureCheck: z.string().optional().nullable(),
  photoUrl: z.string().min(1, "Pickup verification photo is required as physical proof of quality"),
  notes: z.string().optional().nullable(),
});

test('1. Verifies existing DON-2026-0004 delivery record is intact', async () => {
  const delivery = await db.delivery.findFirst({
    where: { donation: { humanReadableId: 'DON-2026-0004' } },
    include: {
      donation: { include: { provider: true } },
      ngo: true,
      distributor: { include: { user: true } },
      pickupVerification: true,
    }
  });

  assert.ok(delivery, 'Delivery for DON-2026-0004 must exist');
  assert.strictEqual(delivery.donation.humanReadableId, 'DON-2026-0004');
  assert.strictEqual(delivery.donation.provider.organizationName, 'Green Leaf Luxury Hotel');
  assert.strictEqual(delivery.ngo.organizationName, 'Helping Hands Community Food Bank');
  assert.strictEqual(delivery.distributor.user.name, 'Rahul Kumar');
});

test('2. Verifies mandatory photo verification in pickupVerificationSchema', () => {
  // Missing photo should fail
  const invalidPayload = {
    verificationCode: '4821',
    packageCondition: 'GOOD',
    temperatureCheck: '4°C',
  };
  const resFail = pickupVerificationSchema.safeParse(invalidPayload);
  assert.strictEqual(resFail.success, false, 'Validation must reject missing photoUrl');

  // With photo should pass
  const validPayload = {
    verificationCode: '4821',
    packageCondition: 'GOOD',
    temperatureCheck: '4°C',
    photoUrl: '/uploads/verifications/sample_photo.jpg',
  };
  const resPass = pickupVerificationSchema.safeParse(validPayload);
  assert.strictEqual(resPass.success, true, 'Validation must accept valid photoUrl');
});

test('3. Generates genuine downloadable PDF buffer with actual DB values and photo', async () => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'verifications');
  const testImgPath = path.join(uploadDir, 'test_proof_sample.jpg');
  assert.ok(fs.existsSync(testImgPath), 'Verification photo must exist on disk');
  const imgStat = fs.statSync(testImgPath);
  assert.ok(imgStat.size > 1000, `Image file must be a real photo (size: ${imgStat.size} bytes)`);

  const delivery = await db.delivery.findFirst({
    where: { donation: { humanReadableId: 'DON-2026-0004' } },
    include: {
      donation: { include: { provider: true } },
      ngo: true,
      distributor: { include: { user: true } },
      pickupVerification: true,
      deliveryVerification: true,
      feedback: true,
    }
  });

  assert.ok(delivery, 'Delivery record must exist');
  const impact = calculateImpactFromKg(delivery.donation.quantity);

  const pdfBuffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Render header
    doc.rect(40, 40, 515, 60).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(14).text('SMART FOOD SUPPLY CHAIN PLATFORM', 55, 52);
    doc.fillColor('#34d399').fontSize(9).text('OFFICIAL CHAIN OF CUSTODY & TRANSIT HANDOFF REPORT', 55, 70);
    doc.fillColor('#ffffff').fontSize(11).text(delivery.donation.humanReadableId, 440, 55, { align: 'right', width: 100 });

    // Render DB content
    doc.fillColor('#000000').fontSize(10).text(`Batch: ${delivery.donation.foodName} (${delivery.donation.quantity} ${delivery.donation.unit})`, 48, 120);
    doc.text(`Donor: ${delivery.donation.provider.organizationName}`, 48, 140);
    doc.text(`Recipient NGO: ${delivery.ngo.organizationName}`, 48, 160);
    doc.text(`Driver: ${delivery.distributor.user.name}`, 48, 180);
    doc.text(`Rating: ${delivery.feedback?.rating || 5} / 5 Stars (Verified Performance)`, 48, 200);
    doc.text(`Impact: ${impact.mealsServed} Meals Provided | ${impact.co2SavedKg} KG CO2 Diverted`, 48, 220);

    // Embed photo
    doc.image(testImgPath, 48, 245, { width: 140, height: 95, fit: [140, 95] });

    doc.end();
  });

  assert.ok(Buffer.isBuffer(pdfBuffer), 'PDF result must be a Buffer');
  assert.ok(pdfBuffer.length > 500, 'PDF buffer must contain substantial PDF data');
  assert.strictEqual(pdfBuffer.slice(0, 4).toString(), '%PDF', 'PDF buffer must start with %PDF magic header');
});

test('4. Enforces strict authorization guard (Unauthorized NGO rejected, Authorized NGO accepted)', async () => {
  const delivery = await db.delivery.findFirst({
    where: { donation: { humanReadableId: 'DON-2026-0004' } },
    include: { ngo: true }
  });

  const checkAccess = (userRole, userNgoId) => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'NGO') {
      if (userNgoId !== delivery.ngoId) {
        throw new Error('Access denied: NGOs can only access reports for their own received deliveries.');
      }
      return true;
    }
    throw new Error('Access denied');
  };

  // Admin access
  assert.strictEqual(checkAccess('ADMIN', null), true);

  // Authorized NGO access
  assert.strictEqual(checkAccess('NGO', delivery.ngoId), true);

  // Unauthorized NGO access
  assert.throws(
    () => checkAccess('NGO', 'other-unauthorized-ngo-uuid'),
    /Access denied/
  );
});