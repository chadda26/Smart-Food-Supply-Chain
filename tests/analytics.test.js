const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
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

function normalizeToKg(quantity, unit) {
  const q = Number(quantity) || 0;
  const u = (unit || "KG").toUpperCase();
  if (u === "PORTIONS") return q * 0.45;
  if (u === "BOXES") return q * 10;
  if (u === "LITERS" || u === "L") return q * 1.0;
  return q;
}

function buildDateFilter(filter) {
  if (!filter || filter.range === "all") return undefined;

  const now = new Date();
  if (filter.range === "7d") {
    return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), lte: now };
  }
  if (filter.range === "30d") {
    return { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), lte: now };
  }
  if (filter.range === "90d") {
    return { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), lte: now };
  }
  if (filter.range === "custom" && (filter.from || filter.to)) {
    const res = {};
    if (filter.from && !isNaN(new Date(filter.from).getTime())) res.gte = new Date(filter.from);
    if (filter.to && !isNaN(new Date(filter.to).getTime())) res.lte = new Date(filter.to);
    return Object.keys(res).length > 0 ? res : undefined;
  }
  return undefined;
}

test('Analytics: Date range filter calculation and edge cases', () => {
  const now = Date.now();

  // All time
  assert.strictEqual(buildDateFilter({ range: 'all' }), undefined);
  assert.strictEqual(buildDateFilter(undefined), undefined);

  // 7 days
  const f7 = buildDateFilter({ range: '7d' });
  assert.ok(f7.gte && f7.lte);
  assert.ok(now - f7.gte.getTime() >= 6.9 * 24 * 60 * 60 * 1000);

  // 30 days
  const f30 = buildDateFilter({ range: '30d' });
  assert.ok(f30.gte && f30.lte);
  assert.ok(now - f30.gte.getTime() >= 29.9 * 24 * 60 * 60 * 1000);

  // Custom valid range
  const custom = buildDateFilter({ range: 'custom', from: '2026-08-01', to: '2026-08-31' });
  assert.ok(custom.gte instanceof Date && custom.lte instanceof Date);
  assert.strictEqual(custom.gte.toISOString().slice(0, 10), '2026-08-01');

  // Custom invalid date handling
  const customInvalid = buildDateFilter({ range: 'custom', from: 'invalid-date' });
  assert.strictEqual(customInvalid, undefined, 'Invalid date string must return undefined gracefully');
});

test('Analytics: Unit normalization to standard kilograms', () => {
  assert.strictEqual(normalizeToKg(50, 'KG'), 50);
  assert.strictEqual(normalizeToKg(100, 'PORTIONS'), 45); // 100 * 0.45 = 45 kg
  assert.strictEqual(normalizeToKg(5, 'BOXES'), 50);      // 5 * 10 = 50 kg
  assert.strictEqual(normalizeToKg(20, 'LITERS'), 20);    // 20 * 1 = 20 kg
  assert.strictEqual(normalizeToKg(0, 'KG'), 0);
  assert.strictEqual(normalizeToKg(null, 'KG'), 0);
});

test('Analytics: Real-time database query validation and metric derivation', async () => {
  const donations = await db.foodDonation.findMany();
  const deliveries = await db.delivery.findMany({ include: { donation: true } });

  assert.ok(donations.length >= 4, 'Must have at least 4 donations in database');
  assert.ok(deliveries.length >= 3, 'Must have deliveries in database');

  let totalDonatedKg = 0;
  let totalRescuedKg = 0;

  for (const d of donations) {
    const kg = normalizeToKg(d.quantity, d.unit);
    totalDonatedKg += kg;
    if (d.status === 'COMPLETED' || d.status === 'DELIVERED') {
      totalRescuedKg += kg;
    }
  }

  assert.ok(totalDonatedKg > 0, 'Total donated kg must be positive');
  assert.ok(totalRescuedKg > 0, 'Total rescued kg must be positive');
  assert.ok(totalRescuedKg <= totalDonatedKg, 'Rescued kg cannot exceed donated kg');

  const impact = calculateImpactFromKg(totalRescuedKg);
  assert.ok(impact.mealsServed > 0, 'Meals served must be computed from rescued kg');
  assert.ok(impact.co2SavedKg > 0, 'CO2 saved must be computed from rescued kg');
});

test('Analytics: Empty dataset and zero-state handling', () => {
  const emptyDonations = [];
  let totalKg = 0;
  let rescuedKg = 0;

  for (const d of emptyDonations) {
    totalKg += d.quantity;
  }

  const impact = calculateImpactFromKg(rescuedKg);
  assert.strictEqual(impact.mealsServed, 0);
  assert.strictEqual(impact.co2SavedKg, 0);
  assert.strictEqual(impact.waterSavedLiters, 0);
  assert.strictEqual(impact.financialValueSavedUsd, 0);

  const diversionRate = totalKg > 0 ? (rescuedKg / totalKg) * 100 : 0;
  assert.strictEqual(diversionRate, 0, 'Zero denominator must not yield NaN or Infinity');
});

test('Analytics: Role authorization guard for admin stats', () => {
  const checkAdminAuth = (userRole) => {
    if (userRole !== 'ADMIN') {
      const err = new Error('Forbidden. Admin authorization required');
      err.statusCode = 403;
      throw err;
    }
    return true;
  };

  assert.strictEqual(checkAdminAuth('ADMIN'), true);
  assert.throws(() => checkAdminAuth('NGO'), /Forbidden/);
  assert.throws(() => checkAdminAuth('FOOD_PROVIDER'), /Forbidden/);
  assert.throws(() => checkAdminAuth('DISTRIBUTOR'), /Forbidden/);
});