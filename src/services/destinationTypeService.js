// Decides what KIND of destination was searched, so the dashboard doesn't
// treat every search as a trek — and, just as importantly, doesn't fail to
// recognize an ordinary city either. This is deliberately NOT an AI guess —
// it combines real, checkable signals:
//
//   1. A curated list of well-known trek/peak names (see KNOWN_TREK_NAMES)
//      — needed because many real trekking destinations share their name
//      with an ordinary village/locality in OSM (e.g. "Kudremukh" alone,
//      with no "Trek" suffix, often geocodes to a village/hamlet, not a
//      natural=peak node), so OSM tags alone under-detect them.
//   2. Explicit keywords in what the user typed ("Kudremukh TREK", "Nandi
//      HILLS") — a strong, explicit signal of intent.
//   3. OpenStreetMap's own category tags for the geocoded result (class /
//      type, e.g. class="natural" type="peak", or class="place"
//      type="city", or class="boundary" type="administrative") — real
//      geographic metadata, not inference.
//
// Only if nothing matches does this fall back to "other" — treated as a
// city/tourist-style destination in the dashboard (the safe default), never
// assumed to be a trek.

export const CATEGORY_LABELS = {
  trek: 'Trek / Hiking Trail',
  peak: 'Mountain / Peak',
  hill: 'Hill Station',
  nature: 'Nature Destination',
  attraction: 'Tourist Destination',
  city: 'City / Town',
  other: 'Other',
}

const TREK_KEYWORDS = ['trek', 'trekking', 'trail', 'hike', 'hiking', 'giri', 'betta', 'parvata']
const PEAK_KEYWORDS = ['peak', 'summit', 'malai']
const HILL_KEYWORDS = ['hill', 'hills', 'hill station']
const NATURE_KEYWORDS = [
  'falls',
  'waterfall',
  'forest',
  'wildlife',
  'sanctuary',
  'national park',
  'reserve',
]

// A small, curated supplementary list of well-known South-Indian trekking
// destinations whose plain name (no "Trek" suffix) commonly geocodes to a
// village/locality rather than a tagged natural feature. This is NOT meant
// to be exhaustive or a replacement for real classification — it's a
// targeted fix for exactly the kind of miss called out in testing
// ("Kudremukh" alone should still be recognized as a trek). Extend this
// list as more such gaps are found.
const KNOWN_TREK_NAMES = [
  'kudremukh',
  'kudremukha',
  'kumara parvatha',
  'kumaraparvatha',
  'kodachadri',
  'tadiandamol',
  'mullayanagiri',
  'bababudangiri',
  'chandradrona',
  'anthargange',
  'savandurga',
  'skandagiri',
  'nandi hills',
  'gudibande',
]

// Real OSM class/type → category lookup. This is the geographic-data half
// of the classification.
const OSM_TYPE_MAP = {
  natural: { peak: 'peak', ridge: 'peak', volcano: 'peak', hill: 'hill', wood: 'nature' },
  highway: { path: 'trek', footway: 'trek', track: 'trek', bridleway: 'trek', steps: 'trek' },
  leisure: { nature_reserve: 'nature', park: 'nature' },
  boundary: { protected_area: 'nature', national_park: 'nature', forest: 'nature' },
  tourism: {
    viewpoint: 'hill',
    attraction: 'attraction',
    museum: 'attraction',
    zoo: 'attraction',
    theme_park: 'attraction',
  },
  place: {
    city: 'city',
    town: 'city',
    village: 'city',
    suburb: 'city',
    hamlet: 'city',
    county: 'city',
    state: 'city',
    state_district: 'city',
    municipality: 'city',
    locality: 'city',
    borough: 'city',
    neighbourhood: 'city',
  },
}

// Classes that, on their own with no other signal, are still overwhelmingly
// likely to be an ordinary place/settlement search (this is bug fix "A":
// many Indian city searches come back as class="boundary" type
// "administrative" rather than class="place", and were falling through to
// the unhelpful "other" bucket).
const CITY_LIKE_CLASSES = new Set(['place', 'boundary'])

function matchKeyword(text, keywords) {
  return keywords.some((k) => text.includes(k))
}

/**
 * @param {string} query - what the user typed, e.g. "Kudremukh Trek"
 * @param {{osmClass:string, osmType:string}} geocodeResult
 * @returns {{ category: string, label: string, trekEligible: boolean }}
 */
export function classifyDestination(query, geocodeResult = {}) {
  const text = (query || '').toLowerCase().trim()
  const { osmClass, osmType } = geocodeResult

  let category = null

  // 1. Curated known-trek-name list — checked first since it's the most
  // specific fix for names that would otherwise be missed entirely.
  if (KNOWN_TREK_NAMES.some((name) => text.includes(name))) category = 'trek'

  // 2. Explicit keyword signal from what the user typed.
  if (!category) {
    if (matchKeyword(text, TREK_KEYWORDS)) category = 'trek'
    else if (matchKeyword(text, PEAK_KEYWORDS)) category = 'peak'
    else if (matchKeyword(text, HILL_KEYWORDS)) category = 'hill'
    else if (matchKeyword(text, NATURE_KEYWORDS)) category = 'nature'
  }

  // 3. Real OSM category tags for the geocoded result.
  if (!category) {
    category = OSM_TYPE_MAP[osmClass]?.[osmType] || null
  }

  // 4. Class-level fallback — an unrecognized `type` under a city-like
  // `class` is still almost always an ordinary place, not "other".
  if (!category && CITY_LIKE_CLASSES.has(osmClass)) {
    category = 'city'
  }

  // 5. Safe default — never assumed to be a trek.
  if (!category) category = 'other'

  return {
    category,
    label: CATEGORY_LABELS[category],
    trekEligible: ['trek', 'peak', 'hill', 'nature'].includes(category),
  }
}
