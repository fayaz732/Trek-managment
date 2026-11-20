import { BedDouble, ExternalLink } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { googleMapsSearchUrl } from '../utils/googleMaps'

export default function WhereToStay({ places, destName }) {
  if (!places || places.length === 0) {
    return (
      <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
        <SectionHeading title="Where to Stay" icon={BedDouble} />
        <p className="mt-4 text-sm text-forest-500">
          No notable accommodation was found near this destination from available map data.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading title="Where to Stay" subtitle={`Near ${destName}`} icon={BedDouble} />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <div key={place.id} className="rounded-xl border border-forest-100 p-4">
            <p className="text-sm font-semibold text-forest-900">🏨 {place.name}</p>
            {place.stars && <p className="mt-1 text-xs text-khaki-500">{'★'.repeat(place.stars)}</p>}
            <p className="mt-1 text-xs text-forest-400">📏 {place.distanceKm.toFixed(1)} km away</p>
            <a
              href={googleMapsSearchUrl(place.name, destName)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-900"
            >
              Open in Google Maps <ExternalLink size={12} />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
