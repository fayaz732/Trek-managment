// OSRM's free public server only reliably serves driving/car routing, and
// there is no free, key-free API for real bus or train timetables. Rather
// than fake those, every non-car mode here is a transparent, labeled
// estimate derived from the one real number we have — the car route's
// distance and duration — using typical average-speed assumptions. This
// matches the brief's own example ("Bike — Estimated 4 hr 10 min").

const AVG_SPEED_KMH = {
  bike: null, // derived as a percentage of car time below (traffic lane-splitting effect)
  bus: 40, // typical intercity bus average incl. stops
  train: 55, // typical broad-gauge intercity average; rail distance assumed ~15% longer than road
}

function formatHours(hours) {
  if (!isFinite(hours) || hours <= 0) return null
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

/**
 * @param {{distanceKm:number, durationHours:number}} carRoute - real OSRM result
 * @returns {{mode:string, icon:string, label:string, durationLabel:string|null, estimated:boolean, available:boolean}[]}
 */
export function computeTravelOptions({ distanceKm, durationHours }) {
  const options = []

  options.push({
    mode: 'car',
    icon: 'Car',
    title: 'Car',
    durationLabel: formatHours(durationHours),
    note: 'Real road route',
    estimated: false,
    available: true,
  })

  // Bike (motorbike): typically a little faster than car in mixed traffic,
  // a little slower on pure highway stretches — 0.92x car time is a
  // reasonable, clearly-labeled midpoint estimate, not a routed result.
  const bikeHours = durationHours * 0.92
  options.push({
    mode: 'bike',
    icon: 'Bike',
    title: 'Bike',
    durationLabel: formatHours(bikeHours),
    note: 'Estimated from road distance',
    estimated: true,
    available: true,
  })

  // Bus: no live schedule API used — a typical average-speed estimate.
  const busHours = distanceKm / AVG_SPEED_KMH.bus
  options.push({
    mode: 'bus',
    icon: 'Bus',
    title: 'Bus',
    durationLabel: formatHours(busHours),
    note: 'Typical duration — real-time schedules unavailable',
    estimated: true,
    available: distanceKm >= 5,
  })

  // Train: only shown as an estimate for longer distances, since short
  // hops rarely have a direct rail option — and even then, it's a rough
  // average-speed figure, not a fetched timetable.
  const trainHours = (distanceKm * 1.15) / AVG_SPEED_KMH.train
  options.push({
    mode: 'train',
    icon: 'TrainFront',
    title: 'Train',
    durationLabel: distanceKm >= 30 ? formatHours(trainHours) : null,
    note: distanceKm >= 30 ? 'Typical duration — real-time schedules unavailable' : 'Data unavailable',
    estimated: true,
    available: distanceKm >= 30,
  })

  return options
}

/**
 * Trek mode shows the road approach (car/bike to the trailhead) plus the
 * trek duration itself, which is only shown when we actually have it —
 * this project has no trail-duration data source, so it's honestly marked
 * unavailable rather than guessed.
 */
export function computeTrailheadOptions({ distanceKm, durationHours }) {
  const carHours = durationHours
  const bikeHours = durationHours * 0.92
  return [
    {
      mode: 'car',
      icon: 'Car',
      title: 'Road to Trailhead',
      durationLabel: formatHours(carHours),
      note: 'Real road route',
      estimated: false,
      available: true,
    },
    {
      mode: 'bike',
      icon: 'Bike',
      title: 'Bike to Trailhead',
      durationLabel: formatHours(bikeHours),
      note: 'Estimated from road distance',
      estimated: true,
      available: true,
    },
    {
      mode: 'trek',
      icon: 'Footprints',
      title: 'Trek Duration',
      durationLabel: null,
      note: 'Data unavailable — no trail-duration source for this destination',
      estimated: true,
      available: false,
    },
  ]
}
