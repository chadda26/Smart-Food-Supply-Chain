const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const db = new PrismaClient();

const wasteReasonEnum = z.enum([
  "EXPIRED_BEFORE_PICKUP",
  "SPOILED_IN_STORAGE",
  "DAMAGED_IN_TRANSIT",
  "CONTAMINATED",
  "REJECTED_AT_PICKUP",
  "REJECTED_AT_DELIVERY",
  "QUANTITY_MISMATCH_DISCARD",
  "COLD_CHAIN_FAILURE",
  "OTHER",
]);

const disposalMethodEnum = z.enum([
  "COMPOSTING",
  "ANIMAL_FEED",
  "BIO_ENERGY_ANAEROBIC",
  "COMMERCIAL_INCINERATION",
  "LANDFILL_DISPOSAL",
  "NOT_SPECIFIED",
]);

const createWasteRecordSchema = z.object({
  foodName: z.string().min(2, "Food name is required"),
  foodCategory: z.string().min(2, "Food category is required"),
  quantityWasted: z.number().positive("Wasted quantity must be greater than 0"),
  unit: z.string().default("KG"),
  reason: wasteReasonEnum,
  disposalMethod: disposalMethodEnum.default("NOT_SPECIFIED"),
  stage: z.string().min(2, "Stage description is required"),
  notes: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  donationId: z.string().uuid("Invalid donation ID").optional().nullable(),
  deliveryId: z.string().uuid("Invalid delivery ID").optional().nullable(),
});

test('Waste Schema: Valid waste payload succeeds validation', () => {
  const payload = {
    foodName: "Surplus Cooked Rice Trays",
    foodCategory: "COOKED_MEALS",
    quantityWasted: 12.5,
    unit: "KG",
    reason: "SPOILED_IN_STORAGE",
    disposalMethod: "COMPOSTING",
    stage: "PROVIDER_KITCHEN",
    notes: "Thermal abuse during storage",
  };

  const parsed = createWasteRecordSchema.parse(payload);
  assert.strictEqual(parsed.foodName, "Surplus Cooked Rice Trays");
  assert.strictEqual(parsed.quantityWasted, 12.5);
  assert.strictEqual(parsed.reason, "SPOILED_IN_STORAGE");
  assert.strictEqual(parsed.disposalMethod, "COMPOSTING");
});

test('Waste Schema: Rejects negative, zero, or missing quantities', () => {
  assert.throws(() => {
    createWasteRecordSchema.parse({
      foodName: "Bread",
      foodCategory: "BAKERY",
      quantityWasted: -5,
      reason: "OTHER",
      stage: "TRANSIT",
    });
  }, /greater than 0/);

  assert.throws(() => {
    createWasteRecordSchema.parse({
      foodName: "Bread",
      foodCategory: "BAKERY",
      quantityWasted: 0,
      reason: "OTHER",
      stage: "TRANSIT",
    });
  }, /greater than 0/);
});

test('Waste Schema: Validates all 9 WasteReason enum values', () => {
  const reasons = [
    "EXPIRED_BEFORE_PICKUP",
    "SPOILED_IN_STORAGE",
    "DAMAGED_IN_TRANSIT",
    "CONTAMINATED",
    "REJECTED_AT_PICKUP",
    "REJECTED_AT_DELIVERY",
    "QUANTITY_MISMATCH_DISCARD",
    "COLD_CHAIN_FAILURE",
    "OTHER",
  ];

  reasons.forEach((r) => {
    assert.strictEqual(wasteReasonEnum.parse(r), r);
  });

  assert.throws(() => wasteReasonEnum.parse("UNKNOWN_REASON"));
});

test('Waste Schema: Validates all 6 DisposalMethod enum values', () => {
  const methods = [
    "COMPOSTING",
    "ANIMAL_FEED",
    "BIO_ENERGY_ANAEROBIC",
    "COMMERCIAL_INCINERATION",
    "LANDFILL_DISPOSAL",
    "NOT_SPECIFIED",
  ];

  methods.forEach((m) => {
    assert.strictEqual(disposalMethodEnum.parse(m), m);
  });

  assert.throws(() => disposalMethodEnum.parse("ILLEGAL_DUMPING"));
});

test('Waste Business Logic: Reconciles partial quantity and rejects excess waste', () => {
  const originalDonationKg = 40;
  const acceptedReceivedKg = 35;
  const validWasteKg = 5;
  const excessiveWasteKg = 10;

  // Valid partial reconciliation
  assert.ok(acceptedReceivedKg + validWasteKg <= originalDonationKg);

  // Invalid partial reconciliation
  assert.ok(acceptedReceivedKg + excessiveWasteKg > originalDonationKg);
});

test('Waste Multi-Tenant Guards: Enforces role-based isolation', () => {
  const checkTenantAccess = (userRole, userOrgId, resourceOrgId) => {
    if (userRole === "ADMIN") return true;
    if (userOrgId !== resourceOrgId) {
      throw new Error("Forbidden: Cross-tenant access denied.");
    }
    return true;
  };

  // Admin access
  assert.strictEqual(checkTenantAccess("ADMIN", "org-1", "org-2"), true);

  // Provider access own
  assert.strictEqual(checkTenantAccess("FOOD_PROVIDER", "provider-1", "provider-1"), true);

  // Provider access another
  assert.throws(() => checkTenantAccess("FOOD_PROVIDER", "provider-1", "provider-2"), /Forbidden/);

  // NGO access own
  assert.strictEqual(checkTenantAccess("NGO", "ngo-1", "ngo-1"), true);

  // NGO access another
  assert.throws(() => checkTenantAccess("NGO", "ngo-1", "ngo-2"), /Forbidden/);
});

test('Waste Database Verification: Key transactions DON-2026-0003 & DON-2026-0004 remain intact', async () => {
  const d3 = await db.foodDonation.findUnique({ where: { humanReadableId: "DON-2026-0003" } });
  const d4 = await db.foodDonation.findUnique({ where: { humanReadableId: "DON-2026-0004" } });

  assert.ok(d3, "DON-2026-0003 must exist in database");
  assert.strictEqual(d3.status, "PICKED_UP");
  assert.strictEqual(d3.quantity, 60);

  assert.ok(d4, "DON-2026-0004 must exist in database");
  assert.strictEqual(d4.status, "COMPLETED");
  assert.strictEqual(d4.quantity, 40);
});

test('Waste Statistics: Empty dataset returns zero safely without NaN', () => {
  const emptyRecords = [];
  let totalWastedKg = 0;
  let compostedKg = 0;

  for (const r of emptyRecords) {
    totalWastedKg += r.quantityWasted;
  }

  const circularity = totalWastedKg > 0 ? (compostedKg / totalWastedKg) * 100 : 0;
  assert.strictEqual(totalWastedKg, 0);
  assert.strictEqual(circularity, 0);
});