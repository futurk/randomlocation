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
