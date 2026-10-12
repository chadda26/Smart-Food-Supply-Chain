import { ImpactMetrics } from "@/types";

// Standard environmental and socioeconomic impact conversion constants
// Ref: Food and Agriculture Organization (FAO) & EPA Waste Reduction Model (WARM)
export const IMPACT_CONSTANTS = {
  MEALS_PER_KG: 2.4, // Average portion is ~416 grams
  CO2E_KG_PER_KG_FOOD: 2.5, // 1 kg food waste diverted prevents ~2.5 kg CO2 equivalent emissions
  WATER_LITERS_PER_KG_FOOD: 1250, // Average embedded water footprint across food types
  FINANCIAL_VALUE_USD_PER_KG: 3.5, // Average commercial retail value per kg of edible food
};

export function calculateImpactFromKg(foodKg: number): {
  mealsServed: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  financialValueSavedUsd: number;
} {
  const safeKg = Math.max(0, foodKg);
  return {
    mealsServed: Math.round(safeKg * IMPACT_CONSTANTS.MEALS_PER_KG),
    co2SavedKg: Math.round(safeKg * IMPACT_CONSTANTS.CO2E_KG_PER_KG_FOOD * 10) / 10,
    waterSavedLiters: Math.round(safeKg * IMPACT_CONSTANTS.WATER_LITERS_PER_KG_FOOD),
    financialValueSavedUsd: Math.round(safeKg * IMPACT_CONSTANTS.FINANCIAL_VALUE_USD_PER_KG * 100) / 100,
  };
}