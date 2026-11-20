import { sampleRoutePoints } from './routingService'
import { haversineKm, downsampleGeometry, distanceToRouteKm } from '../utils/geo'

// Overpass is the free query API for OpenStreetMap data — no API key
// required.
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const ROUTE_SEARCH_RADIUS_M = 4000
const ROUTE_MAX_DISTANCE_KM = 6 // places farther than this from the route line are dropped
const POINT_SEARCH_RADIUS_M = 8000

const AMENITY_REGEX = 'restaurant|cafe|fast_food|fuel|hospital|clinic|parking'
const TOURISM_REGEX = 'hotel|guest_house|hostel|attraction|viewpoint'

/** Maps raw OSM tags to one of our simplified route-corridor category ids. */
function categorizeRoutePlace(tags = {}) {
  const { amenity, tourism } = tags
  if (['restaurant', 'cafe', 'fast_food'].includes(amenity)) return 'food'
  if (amenity === 'fuel') return 'fuel'
  if (['hotel', 'guest_house', 'hostel'].includes(tourism)) return 'hotel'
  if (['hospital', 'clinic'].includes(amenity)) return 'hospital'
  if (['attraction', 'viewpoint'].includes(tourism)) return 'attraction'
  if (amenity === 'parking') return 'parking'
  return null
}

/** Turns raw Overpass elements into deduplicated, named place records. */
function parseElements(elements, categorizeFn) {
  const seen = new Set()
  const places = []

  for (const el of elements || []) {
    const category = categorizeFn(el.tags)
    if (!category) continue

    const name = el.tags?.name
    if (!name) continue // skip unnamed places — they clutter the UI

    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null) continue

    const id = `${el.type}${el.id}`
    if (seen.has(id)) continue
    seen.add(id)

    places.push({
      id,
      name,
      category,
      lat,
      lon,
      cuisine: el.tags?.cuisine,
      stars: el.tags?.stars ? Number(el.tags.stars) : undefined,
    })
  }

  return places
}

async function runOverpassQuery(query) {
  let response
  try {
    response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query,
    })
  } catch (err) {
    // Places are a nice-to-have layer — don't block the whole dashboard if
    // Overpass is unreachable.
    return []
  }
  if (!response.ok) return []
  const data = await response.json()
  return data.elements || []
}

function buildRouteQuery(points) {
  const clauses = points
    .map(([lat, lon]) => {
      const around = `(around:${ROUTE_SEARCH_RADIUS_M},${lat},${lon})`
      return [
        `node["amenity"~"${AMENITY_REGEX}"]${around};`,
        `way["amenity"~"${AMENITY_REGEX}"]${around};`,
        `node["tourism"~"${TOURISM_REGEX}"]${around};`,
        `way["tourism"~"${TOURISM_REGEX}"]${around};`,
      ].join('\n')
    })
    .join('\n')

  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center 80;`
}

/**
 * Places along an actual road route. Sampling follows real cumulative
 * distance (see routingService.sampleRoutePoints) and every returned place
 * additionally gets a computed distanceFromRouteKm, is filtered to
 * ROUTE_MAX_DISTANCE_KM, and is sorted by that distance — this is the
 * "corridor" behavior: a place near the route is kept and ranked by
 * closeness, not just "found somewhere near a sample point."
 *
 * @param {[number, number][]} routeGeometry - array of [lat, lon] from the routing service
 */
export async function getPlacesAlongRoute(routeGeometry) {
  if (!routeGeometry || routeGeometry.length === 0) return []

  const samplePoints = sampleRoutePoints(routeGeometry, 40, 10)
  const query = buildRouteQuery(samplePoints)
  const elements = await runOverpassQuery(query)
  const places = parseElements(elements, categorizeRoutePlace)

  const routeVertices = downsampleGeometry(routeGeometry, 200)

  return places
    .map((p) => ({ ...p, distanceFromRouteKm: distanceToRouteKm([p.lat, p.lon], routeVertices) }))
    .filter((p) => p.distanceFromRouteKm <= ROUTE_MAX_DISTANCE_KM)
    .sort((a, b) => a.distanceFromRouteKm - b.distanceFromRouteKm)
}

function buildPointQuery(point, radiusM, tagRegexByFamily) {
  const around = `(around:${radiusM},${point.lat},${point.lon})`
  const clauses = Object.entries(tagRegexByFamily)
    .flatMap(([family, regex]) => [`node["${family}"~"${regex}"]${around};`, `way["${family}"~"${regex}"]${around};`])
    .join('\n')
  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center 60;`
}

function withDistance(places, point) {
  return places
    .map((p) => ({ ...p, distanceKm: haversineKm([point.lat, point.lon], [p.lat, p.lon]) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

/** Real tourist attractions near a point (city/destination mode). */
export async function getNearbyAttractions(point, limit = 8) {
  const query = buildPointQuery(point, POINT_SEARCH_RADIUS_M, {
    tourism: 'attraction|museum|zoo|theme_park|artwork|gallery|viewpoint',
    historic: 'castle|monument|ruins|memorial|fort|archaeological_site',
    leisure: 'park|garden',
  })
  const elements = await runOverpassQuery(query)
  const places = parseElements(elements, (tags = {}) => {
    if (tags.tourism) return 'attraction'
    if (tags.historic) return 'attraction'
    if (tags.leisure) return 'attraction'
    return null
  })
  return withDistance(places, point).slice(0, limit)
}

/** Real restaurants/cafes near a point (city/destination mode). */
export async function getNearbyRestaurants(point, limit = 4) {
  const query = buildPointQuery(point, POINT_SEARCH_RADIUS_M, {
    amenity: 'restaurant|cafe|fast_food',
  })
  const elements = await runOverpassQuery(query)
  const places = parseElements(elements, (tags = {}) =>
    ['restaurant', 'cafe', 'fast_food'].includes(tags.amenity) ? 'food' : null
  )
  // Prefer places with a cuisine tag set (a rough proxy for a more
  // "complete", better-maintained OSM entry) before falling back to
  // distance — there is no real popularity/rating data available.
  const withCuisine = places.filter((p) => p.cuisine)
  const rest = places.filter((p) => !p.cuisine)
  const ordered = [...withCuisine, ...rest]
  return withDistance(ordered, point).slice(0, limit)
}

/** Real hotels/guesthouses near a point (city/destination or trek mode). */
export async function getNearbyHotels(point, limit = 6) {
  const query = buildPointQuery(point, POINT_SEARCH_RADIUS_M, {
    tourism: 'hotel|guest_house|hostel|apartment',
  })
  const elements = await runOverpassQuery(query)
  const places = parseElements(elements, (tags = {}) =>
    ['hotel', 'guest_house', 'hostel', 'apartment'].includes(tags.tourism) ? 'hotel' : null
  )
  return withDistance(places, point).slice(0, limit)
}

/**
 * Combined food/hotel/fuel/hospital/parking lookup anchored at a single
 * point — used for "nearby food & stay" around a trek destination/
 * trailhead, where there's no route corridor to sample.
 */
export async function getNearbyServices(point, radiusM = POINT_SEARCH_RADIUS_M) {
  const query = buildPointQuery(point, radiusM, {
    amenity: AMENITY_REGEX,
    tourism: TOURISM_REGEX,
  })
  const elements = await runOverpassQuery(query)
  const places = parseElements(elements, categorizeRoutePlace)
  return withDistance(places, point)
}
