import { haversineKm } from '../utils/geo'

// Calculates a real road route between two coordinates using OSRM (Open
// Source Routing Machine) via its free public demo server. This returns
// actual road geometry — not a straight line — which is why we label it a
// "Road Journey" in the UI rather than claiming it is the hiking trail
// itself. OSRM's public server only routes by road, so it cannot supply a
// dedicated hiking-trail path; the app is explicit about that limitation
// instead of fabricating one.
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'

/**
 * @param {{lat:number, lon:number}} source
 * @param {{lat:number, lon:number}} destination
 * @returns {Promise<{distanceKm:number, durationHours:number, geometry:[number,number][]}>}
 */
export async function getRoute(source, destination) {
  const coords = `${source.lon},${source.lat};${destination.lon},${destination.lat}`
  const url = `${OSRM_URL}/${coords}?overview=full&geometries=geojson`

  let response
  try {
    response = await fetch(url)
  } catch (err) {
    throw new Error('Could not reach the routing service. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Route calculation failed for this pair of locations.')
  }

  const data = await response.json()

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(
      'No road route could be found between these two locations. Try a nearby town instead.'
    )
  }

  const route = data.routes[0]
  // GeoJSON geometry is [lon, lat] pairs — Leaflet wants [lat, lon].
  const geometry = route.geometry.coordinates.map(([lon, lat]) => [lat, lon])

  return {
    distanceKm: route.distance / 1000,
    durationHours: route.duration / 3600,
    geometry,
  }
}

/**
 * Picks points evenly spaced by ACTUAL DISTANCE along a route's geometry —
 * not by array index. Index-based sampling is biased toward stretches with
 * many coordinate points (dense urban turns near the start/end), which is
 * why an earlier version of this function kept returning places clustered
 * near the starting city instead of places spread along the whole route.
 *
 * @param {[number, number][]} geometry - [lat, lon] pairs from the routing service
 * @param {number} targetSpacingKm - roughly how far apart samples should be
 * @param {number} maxPoints - hard cap so the places query stays small
 */
export function sampleRoutePoints(geometry, targetSpacingKm = 40, maxPoints = 10) {
  if (!geometry || geometry.length === 0) return []
  if (geometry.length === 1) return geometry

  // Total route length, so short routes still get a sensible few samples
  // and long routes don't get an unbounded number of them.
  let totalKm = 0
  for (let i = 1; i < geometry.length; i++) {
    totalKm += haversineKm(geometry[i - 1], geometry[i])
  }

  const desiredCount = Math.min(maxPoints, Math.max(3, Math.round(totalKm / targetSpacingKm) + 1))
  const spacing = totalKm / (desiredCount - 1 || 1)

  const samples = [geometry[0]]
  let accumulated = 0
  let nextTarget = spacing

  for (let i = 1; i < geometry.length && samples.length < desiredCount - 1; i++) {
    accumulated += haversineKm(geometry[i - 1], geometry[i])
    if (accumulated >= nextTarget) {
      samples.push(geometry[i])
      nextTarget += spacing
    }
  }

  samples.push(geometry[geometry.length - 1])
  return samples
}
