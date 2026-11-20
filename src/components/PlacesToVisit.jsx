import { Landmark, ExternalLink } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { googleMapsSearchUrl } from '../utils/googleMaps'

export default function PlacesToVisit({ places, destName }) {
  if (!places || places.length === 0) {
    return (
      <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
        <SectionHeading title="Top Places to Visit" icon={Landmark} />
        <p className="mt-4 text-sm text-forest-500">
          No notable attractions were found near this destination from available map data.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading title="Top Places to Visit" subtitle={`Near ${destName}`} icon={Landmark} />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {places.map((place) => (
          <div key={place.id} className="rounded-xl border border-forest-100 p-4">
            <p className="text-sm font-semibold text-forest-900">{place.name}</p>
            <p className="mt-1 text-xs capitalize text-forest-400">{place.category}</p>
            <p className="mt-2 text-xs text-forest-500">{place.distanceKm.toFixed(1)} km away</p>
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
