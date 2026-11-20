import { UtensilsCrossed, Fuel, BedDouble, Cross, SquareParking, MapPinned, ExternalLink } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { googleMapsSearchUrl } from '../utils/googleMaps'

const CATEGORY_META = {
  food: { label: 'Food', icon: UtensilsCrossed, color: '#a9843f' },
  hotel: { label: 'Hotels / Homestays', icon: BedDouble, color: '#294730' },
  fuel: { label: 'Fuel', icon: Fuel, color: '#456e7d' },
  hospital: { label: 'Hospitals / Clinics', icon: Cross, color: '#b0453f' },
  parking: { label: 'Parking', icon: SquareParking, color: '#8fae95' },
}

export default function NearbyFoodStay({ places, destName }) {
  const grouped = Object.keys(CATEGORY_META)
    .map((id) => ({ id, ...CATEGORY_META[id], items: places.filter((p) => p.category === id).slice(0, 4) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading title="Nearby Food & Stay" subtitle={`Around ${destName}`} icon={MapPinned} />

      {grouped.length === 0 ? (
        <p className="mt-4 text-sm text-forest-500">
          No notable food, lodging, or services were found near this destination from available map
          data.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {grouped.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 text-sm font-medium text-forest-800">
                <cat.icon size={15} style={{ color: cat.color }} />
                {cat.label}
              </div>
              <ul className="mt-2 space-y-2">
                {cat.items.map((place) => (
                  <li key={place.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-forest-700">{place.name}</span>
                    <a
                      href={googleMapsSearchUrl(place.name, destName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-forest-400 hover:text-forest-700"
                      title="Open in Google Maps"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
