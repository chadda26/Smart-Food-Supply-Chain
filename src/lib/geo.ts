// Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Calculate estimated travel time in minutes based on average urban transit speed (25 km/h)
export function estimateTravelTimeMinutes(distanceKm: number, speedKmH = 25): number {
  if (distanceKm <= 0) return 5;
  const hours = distanceKm / speedKmH;
  const minutes = Math.round(hours * 60);
  return Math.max(minutes + 5, 5); // Add 5 min buffer
}

// Generate interpolated simulation waypoints between pickup and dropoff
export function generateRouteWaypoints(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  steps = 10
): { latitude: number; longitude: number }[] {
  const waypoints: { latitude: number; longitude: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    // Add small realistic curvature
    const latOffset = Math.sin(fraction * Math.PI) * 0.003;
    const lonOffset = Math.sin(fraction * Math.PI) * 0.002;
    waypoints.push({
      latitude: startLat + (endLat - startLat) * fraction + latOffset,
      longitude: startLon + (endLon - startLon) * fraction + lonOffset,
    });
  }
  return waypoints;
}