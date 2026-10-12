const test = require("node:test");
const assert = require("node:assert/strict");

const CONSTANTS = {
  MEALS_PER_KG: 2.4,
  CO2E_PER_KG: 2.5,
  WATER_L_PER_KG: 1250,
  VALUE_PER_KG: 3.5,
};

function calculateImpact(kg) {
  return {
    meals: Math.round(kg * CONSTANTS.MEALS_PER_KG),
    co2Kg: Math.round(kg * CONSTANTS.CO2E_PER_KG * 10) / 10,
    waterL: Math.round(kg * CONSTANTS.WATER_L_PER_KG),
    valueUsd: Math.round(kg * CONSTANTS.VALUE_PER_KG * 100) / 100,
  };
}

test("Impact: Environmental and social metrics calculation", () => {
  const result = calculateImpact(100);
  assert.equal(result.meals, 240);
  assert.equal(result.co2Kg, 250);
  assert.equal(result.waterL, 125000);
  assert.equal(result.valueUsd, 350);
});

test("Impact: Gracefully handles zero quantity", () => {
  const result = calculateImpact(0);
  assert.equal(result.meals, 0);
  assert.equal(result.co2Kg, 0);
  assert.equal(result.waterL, 0);
  assert.equal(result.valueUsd, 0);
});