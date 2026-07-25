export type TravelMode = "cycling" | "walking" | "driving";

// Utility function to calculate a random point within a minimum and maximum radius (annulus ring area)
export const getRandomLocation = (
  lat: number,
  lng: number,
  minRadius: number,
  maxRadius: number
) => {
  const minR = Math.max(0, Math.min(minRadius, maxRadius));
  const maxR = Math.max(minR, Math.max(minRadius, maxRadius));

  const minDegree = minR / 111; // Convert to degrees (approx 1 degree is ~111km)
  const maxDegree = maxR / 111;

  const u = Math.random();
  const v = Math.random();

  // Uniform area sample between minR^2 and maxR^2
  const w = Math.sqrt(u * (maxDegree * maxDegree - minDegree * minDegree) + minDegree * minDegree);
  const t = 2 * Math.PI * v;

  // Adjust x and y distances based on the random angle
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  // Calculate the new latitude
  const newLat = lat + y;

  // Calculate the new longitude, adjusting for shrinking east-west distances near poles
  const newLng = lng + x / Math.cos(lat * (Math.PI / 180));

  return { lat: newLat, lng: newLng };
};

// Calculate Haversine distance between two sets of coordinates in kilometers
export const getDistanceInKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance nicely for human reading (m or km)
export const formatDistance = (distInKm: number): string => {
  if (distInKm < 1) {
    return `${Math.round(distInKm * 1000)} m`;
  }
  return `${distInKm.toFixed(2)} km`;
};

// Generate Google Maps routing URL with Origin (Center), Destination, and Travel Mode
export const getGoogleMapsUrl = (
  originLat: number | null,
  originLng: number | null,
  destLat: number,
  destLng: number,
  mode: TravelMode = "cycling"
): string => {
  const modeMap: Record<TravelMode, string> = {
    cycling: "bicycling",
    walking: "walking",
    driving: "driving",
  };

  if (originLat !== null && originLng !== null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=${modeMap[mode]}`;
  }
  return `https://www.google.com/maps?q=${destLat},${destLng}`;
};

// Generate Komoot Tour Planner URL centered on Destination with Sport Mode
export const getKomootUrl = (
  _originLat: number | null,
  _originLng: number | null,
  destLat: number,
  destLng: number,
  mode: TravelMode = "cycling"
): string => {
  const sportMap: Record<TravelMode, string> = {
    cycling: "touringbicycle",
    walking: "hike",
    driving: "touringbicycle",
  };

  return `https://www.komoot.com/plan/@${destLat.toFixed(6)},${destLng.toFixed(6)},14z?sport=${sportMap[mode]}`;
};
