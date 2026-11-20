/**
 * Intelligent Trek Analysis Engine
 * ---------------------------------
 * IMPORTANT (for the presentation): this is a transparent, RULE-BASED
 * weighted-scoring engine — not a trained machine-learning model. It takes
 * real data fetched for whatever destination the user searched (route
 * distance/time from OSRM, elevation from Open-Meteo, live weather from
 * Open-Meteo) and combines it with a fixed scoring formula. Nothing here is
 * hardcoded to a specific trek — every score below changes when the
 * destination changes, because every input to the formula does.
 *
 * INPUT (real data for THIS destination)
 *   ↓
 * analyzeTrek()  — weighted scoring rules below
 *   ↓
 * OUTPUT: difficulty, physical demand, weather risk, terrain challenge,
 *         preparation level, equipment list, safety insights
 */

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function classifyLevel(score) {
  if (score < 40) return 'Easy'
  if (score < 70) return 'Moderate'
  return 'Challenging'
}

/**
 * @param {Object} input
 * @param {number} input.distanceKm - road distance from source to destination (OSRM)
 * @param {number} input.durationHours - road travel time (OSRM)
 * @param {number} input.sourceElevationM - elevation at the starting point (Open-Meteo)
 * @param {number} input.destElevationM - elevation at the destination (Open-Meteo)
 * @param {Object} input.weather - { temperature, precipitationProbability, windSpeed, isWet }
 * @param {string} input.activityLabel - how to refer to the activity in generated text (e.g. "trek", "hike")
 */
export function analyzeTrek({
  distanceKm = 0,
  durationHours = 0,
  sourceElevationM = 0,
  destElevationM = 0,
  weather = {},
  activityLabel = 'trek',
}) {
  const { temperature = 20, precipitationProbability = 0, windSpeed = 0, isWet = false } = weather

  const elevationGainM = Math.max(0, destElevationM - sourceElevationM)

  // Elevation challenge: higher-altitude destinations demand more
  // acclimatization and endurance. Normalized against ~3200m, roughly the
  // elevation of the highest common trekking peaks in South India.
  const elevationChallenge = clamp((destElevationM / 3200) * 100)

  // Weather risk: driven mainly by rain probability, with wind and the
  // current condition's "wet" flag adding extra risk.
  const windScore = clamp((windSpeed / 40) * 100)
  const weatherRisk = clamp(
    precipitationProbability * 0.65 + windScore * 0.25 + (isWet ? 15 : 0)
  )

  // Terrain challenge: no dedicated trail-slope API is used here, so this
  // is estimated from elevation (steeper regions tend to sit higher) with a
  // rain penalty, since wet terrain is harder to move through.
  const terrainChallenge = clamp(elevationChallenge * 0.7 + weatherRisk * 0.3)

  // Physical demand: combines how long the approach journey is with how
  // high the destination sits.
  const travelScore = clamp((durationHours / 8) * 100)
  const physicalDemand = clamp(travelScore * 0.45 + elevationChallenge * 0.55)

  const preparationLevel = clamp(
    (physicalDemand + elevationChallenge + weatherRisk + terrainChallenge) / 4
  )

  const overallScore = clamp(
    physicalDemand * 0.25 + elevationChallenge * 0.3 + weatherRisk * 0.25 + terrainChallenge * 0.2
  )

  return {
    scores: {
      physicalDemand: Math.round(physicalDemand),
      elevationChallenge: Math.round(elevationChallenge),
      weatherRisk: Math.round(weatherRisk),
      terrainChallenge: Math.round(terrainChallenge),
      preparationLevel: Math.round(preparationLevel),
      overall: Math.round(overallScore),
    },
    difficultyLevel: classifyLevel(overallScore),
    elevationGainM: Math.round(elevationGainM),
    // Honest about what this IS and ISN'T based on — no invented trail
    // distance or gradient, since no free API reliably supplies that for
    // an arbitrary searched destination.
    disclaimer:
      'Estimated from destination elevation, live weather, and approach travel time — trail-specific distance and gradient data are not available for this location.',
    insight: buildInsight({
      distanceKm,
      destElevationM,
      elevationGainM,
      precipitationProbability,
      temperature,
      difficultyLevel: classifyLevel(overallScore),
      activityLabel,
    }),
  }
}

/** Generates a short, data-grounded explanation — changes with every search. */
function buildInsight({
  distanceKm,
  destElevationM,
  elevationGainM,
  precipitationProbability,
  temperature,
  difficultyLevel,
  activityLabel,
}) {
  const parts = []

  parts.push(
    `This destination is a ${Math.round(distanceKm)} km road journey away, reaching an elevation of about ${Math.round(
      destElevationM
    )} m${elevationGainM > 0 ? ` (roughly ${elevationGainM} m higher than your starting point)` : ''}.`
  )

  if (precipitationProbability >= 50) {
    parts.push(
      `Rain probability is currently high (${Math.round(
        precipitationProbability
      )}%), which may make trail sections slippery.`
    )
  } else if (precipitationProbability >= 20) {
    parts.push(
      `Rain probability is moderate (${Math.round(precipitationProbability)}%) — worth carrying rain protection.`
    )
  } else {
    parts.push(`Rain probability is currently low (${Math.round(precipitationProbability)}%).`)
  }

  if (temperature >= 30) {
    parts.push('Expect warm conditions — pace yourself and carry extra water.')
  } else if (temperature <= 12) {
    parts.push('Expect cool-to-cold conditions — pack warm layers.')
  }

  parts.push(`Overall, this ${activityLabel} is rated ${difficultyLevel.toLowerCase()} based on the factors above.`)

  return parts.join(' ')
}

/** Dynamic equipment list — depends on real weather, elevation, and distance. */
export function generateEquipmentRecommendations({ weather = {}, destElevationM = 0, distanceKm = 0 }) {
  const { temperature = 20, precipitationProbability = 0 } = weather
  const items = [
    { item: 'Trekking shoes', reason: 'Solid grip and ankle support for uneven terrain.' },
    { item: 'Water (2L+)', reason: 'Refill points are often unreliable along the way.' },
    { item: 'First-aid kit', reason: 'Basic supplies for blisters, cuts, or minor sprains.' },
    { item: 'Energy snacks', reason: 'Sustains energy over a long travel and trek day.' },
  ]

  if (precipitationProbability >= 30) {
    items.push({ item: 'Rain jacket', reason: `Rain probability is ${Math.round(precipitationProbability)}% at the destination.` })
    items.push({ item: 'Waterproof bag cover', reason: 'Keeps gear dry if showers pass through.' })
  }

  if (destElevationM >= 1200 || temperature <= 15) {
    items.push({ item: 'Warm layers', reason: `Destination sits at ~${Math.round(destElevationM)} m — temperatures drop with altitude.` })
  }

  if (temperature >= 30) {
    items.push({ item: 'Cap & sunscreen', reason: `Current temperature is ${Math.round(temperature)}°C — sun protection matters.` })
  }

  if (distanceKm >= 150) {
    items.push({ item: 'Power bank', reason: 'A long travel distance means more phone/GPS use before you even start trekking.' })
  }

  items.push({ item: 'Trekking poles', reason: 'Reduces knee strain on steep or long descents.' })

  return items
}

/** Dynamic safety cards — depends on real weather, elevation, and distance. */
export function generateSafetyInsights({ weather = {}, destElevationM = 0, distanceKm = 0, scores = {} }) {
  const { precipitationProbability = 0, temperature = 20 } = weather
  const cards = []

  cards.push({
    key: 'weather',
    title: 'Weather Risk',
    icon: 'CloudRain',
    detail:
      precipitationProbability >= 50
        ? `Heavy rain probability (${Math.round(precipitationProbability)}%) may make trails slippery.`
        : precipitationProbability >= 20
        ? `Moderate rain probability (${Math.round(precipitationProbability)}%) — carry rain protection.`
        : 'Rain probability is currently low.',
    risk: precipitationProbability >= 50 ? 'High' : precipitationProbability >= 20 ? 'Medium' : 'Low',
  })

  cards.push({
    key: 'elevation',
    title: 'Elevation',
    icon: 'Mountain',
    detail:
      destElevationM >= 1800
        ? `Destination elevation (~${Math.round(destElevationM)} m) calls for a steady pace and hydration breaks.`
        : `Destination elevation (~${Math.round(destElevationM)} m) is manageable with standard preparation.`,
    risk: scores.elevationChallenge >= 70 ? 'High' : scores.elevationChallenge >= 40 ? 'Medium' : 'Low',
  })

  cards.push({
    key: 'heat',
    title: 'Heat Risk',
    icon: 'Sun',
    detail:
      temperature >= 30
        ? `Warm conditions (${Math.round(temperature)}°C) — carry sufficient water and avoid peak afternoon heat.`
        : 'Temperature is in a comfortable range for trekking.',
    risk: temperature >= 32 ? 'High' : temperature >= 28 ? 'Medium' : 'Low',
  })

  cards.push({
    key: 'physical',
    title: 'Physical Demand',
    icon: 'Footprints',
    detail:
      scores.physicalDemand >= 70
        ? 'Long travel distance and elevation combined — prepare for a demanding day.'
        : 'Physical demand is moderate for this destination.',
    risk: scores.physicalDemand >= 70 ? 'High' : scores.physicalDemand >= 40 ? 'Medium' : 'Low',
  })

  cards.push({
    key: 'emergency',
    title: 'Emergency Preparation',
    icon: 'Phone',
    detail: `${Math.round(distanceKm)} km from your start point — keep a phone charged; network coverage can be patchy near remote trailheads.`,
    risk: 'Medium',
  })

  return cards
}
