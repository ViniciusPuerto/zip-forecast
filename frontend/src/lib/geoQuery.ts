/** Format decimal degrees for WWO-style `q` (lat,lng). */
export function formatLatLngQuery(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}
