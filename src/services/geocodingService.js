// Converts a free-text place name into coordinates using Nominatim, the
// free geocoding API backed by OpenStreetMap. No API key is required, but
// Nominatim's usage policy asks for at most ~1 request/second and no
// spamming of very short queries, so autocomplete only fires from 2+
// characters and is debounced by the caller (see DestinationAutocomplete).
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// A tiny in-memory cache so re-searching the same text (e.g. re-selecting
// an example, or the user backspacing and retyping the same thing) doesn't
// re-hit the network. Cleared on full page reload — this is a performance
// nicety, not a persistence layer.
const geocodeCache = new Map()

function normalizeQuery(q) {
  return q.trim().toLowerCase()
}

/**
 * @param {string} query - free-text place name, e.g. "Kudremukh Trek"
 * @param {'destination'|'source'} kind - shapes the not-found error message
 * @returns {Promise<{lat: number, lon: number, displayName: string, osmClass: string, osmType: string}>}
 */
export async function geocodeLocation(query, kind = 'destination') {
  const trimmed = query.trim()
  if (!trimmed) {
    throw new Error(
      kind === 'destination' ? 'Please enter a trek destination.' : 'Please enter a starting location.'
    )
  }

  const cacheKey = normalizeQuery(trimmed)
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)

  // class/type are OSM's own category tags (e.g. class="natural",
  // type="peak") and are returned by default — this is the real geographic
  // data used later to tell a trek/hill from a city, rather than guessing
  // from the name alone.
  const url = `${NOMINATIM_URL}?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(
    trimmed
  )}`

  let response
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    throw new Error('Could not reach the location search service. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Location search failed. Please try again in a moment.')
  }

  const results = await response.json()

  if (!results || results.length === 0) {
    throw new Error(
      kind === 'destination'
        ? 'Destination not found. Try searching for a trek, mountain, hill or nature destination.'
        : `We couldn't find "${trimmed}". Try a nearby town or city instead.`
    )
  }

  const best = results[0]
  const parsed = {
    lat: parseFloat(best.lat),
    lon: parseFloat(best.lon),
    displayName: best.display_name,
    osmClass: best.class || '',
    osmType: best.type || '',
  }
  geocodeCache.set(cacheKey, parsed)
  return parsed
}

/**
 * Fetches multiple candidate matches for autocomplete/typo-tolerant search,
 * with an AbortController signal so the caller can cancel a stale
 * in-flight request when the user keeps typing.
 * @param {string} query
 * @param {{signal?: AbortSignal, limit?: number}} options
 * @returns {Promise<{lat:number, lon:number, displayName:string, osmClass:string, osmType:string}[]>}
 */
export async function searchSuggestions(query, { signal, limit = 5 } = {}) {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const cacheKey = `suggest:${normalizeQuery(trimmed)}:${limit}`
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)

  const url = `${NOMINATIM_URL}?format=json&limit=${limit}&addressdetails=0&q=${encodeURIComponent(
    trimmed
  )}`

  let response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    return [] // suggestions are a nicety — fail quietly, the user can still submit
  }

  if (!response.ok) return []

  const results = await response.json()
  const suggestions = (results || []).map((r) => ({
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    displayName: r.display_name,
    osmClass: r.class || '',
    osmType: r.type || '',
  }))

  geocodeCache.set(cacheKey, suggestions)
  return suggestions
}

/**
 * Reverse-geocodes the browser's current-location coordinates into a
 * readable place name, used to fill the "From" field when the user taps
 * "Use my current location".
 */
export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('reverse geocode failed')
    const data = await response.json()
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  } catch {
    // Fall back to raw coordinates if reverse geocoding isn't available —
    // the app can still route from a coordinate pair.
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }
}
