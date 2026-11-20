// Small, dependency-free geo helpers shared across services. Keeping this
// in one place avoids re-implementing haversine math in three files.

export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

/** Reduces a dense route geometry to at most `maxPoints` vertices, kept in
 * order, for cheap distance-to-route checks (exact nearest-vertex distance
 * is a good enough approximation for filtering "is this place near the
 * road" — it doesn't need survey-grade precision). */
export function downsampleGeometry(geometry, maxPoints = 200) {
  if (!geometry || geometry.length <= maxPoints) return geometry || []
  const step = Math.ceil(geometry.length / maxPoints)
  const out = []
  for (let i = 0; i < geometry.length; i += step) out.push(geometry[i])
  const last = geometry[geometry.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

/** Minimum distance (km) from a point to the nearest vertex of a route. */
export function distanceToRouteKm(point, routeVertices) {
  let min = Infinity
  for (const v of routeVertices) {
    const d = haversineKm(point, v)
    if (d < min) min = d
  }
  return min
}
