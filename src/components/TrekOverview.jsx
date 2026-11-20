import { Mountain } from 'lucide-react'
import SectionHeading from './SectionHeading'

function Stat({ label, value, unavailable }) {
  return (
    <div className="rounded-xl border border-forest-100 p-4">
      <p className="text-xs font-medium text-forest-400">{label}</p>
      <p className={`mt-1.5 text-sm font-semibold ${unavailable ? 'text-forest-300' : 'text-forest-900'}`}>
        {value}
      </p>
    </div>
  )
}

export default function TrekOverview({ destName, route, destElevationM, elevationGainM, difficultyLevel }) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading title="Trek Overview" subtitle={destName} icon={Mountain} />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Road distance to trailhead" value={`${Math.round(route.distanceKm)} km`} />
        <Stat label="Road travel duration" value={formatHours(route.durationHours)} />
        <Stat label="Destination elevation" value={`~${Math.round(destElevationM)} m`} />
        <Stat
          label="Elevation gain (approx.)"
          value={elevationGainM > 0 ? `~${elevationGainM} m` : 'Data unavailable'}
          unavailable={elevationGainM <= 0}
        />
        <Stat label="Trail distance" value="Data unavailable" unavailable />
        <Stat label="Trek duration" value="Data unavailable" unavailable />
        <Stat label="Difficulty (AI-estimated)" value={difficultyLevel} />
        <Stat label="Best season" value="Data unavailable" unavailable />
        <Stat label="Trail status" value="Data unavailable" unavailable />
      </div>

      <p className="mt-4 text-xs text-forest-400">
        Trail distance, trek duration, best season, and trail status aren't available from any free
        public data source for this destination, so they're honestly marked unavailable rather than
        estimated.
      </p>
    </div>
  )
}

function formatHours(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}
