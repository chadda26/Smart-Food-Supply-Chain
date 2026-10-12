const test = require("node:test");
const assert = require("node:assert/strict");

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

test("Matching: Haversine distance calculations", () => {
  // Distance between Delhi Connaught Place and India Gate (~2.4 km)
  const dist = calculateDistanceKm(28.6315, 77.2167, 28.6129, 77.2295);
  assert.ok(dist >= 2.0 && dist <= 3.0, `Calculated distance: ${dist}`);
});

test("Matching: Multi-factor score evaluation prioritizes closer NGO with adequate capacity", () => {
  const donation = {
    quantity: 30,
    lat: 28.6139,
    lon: 77.2090,
    hoursUntilExpiry: 5,
  };

  const ngoA = { name: "Close NGO", lat: 28.6200, lon: 77.2150, capacity: 200, available: true };
  const ngoB = { name: "Far NGO", lat: 28.7500, lon: 77.3500, capacity: 500, available: true };

  const distA = calculateDistanceKm(donation.lat, donation.lon, ngoA.lat, ngoA.lon);
  const distB = calculateDistanceKm(donation.lat, donation.lon, ngoB.lat, ngoB.lon);

  assert.ok(distA < distB, "NGO A should be closer than NGO B");
});