import { UtensilsCrossed, Fuel, BedDouble, Cross, Camera, SquareParking, Signpost } from 'lucide-react'
import { PLACE_CATEGORIES } from '../data/placeCategories'
import SectionHeading from './SectionHeading'

const CATEGORY_ICONS = { UtensilsCrossed, Fuel, BedDouble, Cross, Camera, SquareParking }

export default function PlacesAlongRoute({ places }) {
  const grouped = PLACE_CATEGORIES.map((cat) => ({
    ...cat,
    items: places.filter((p) => p.category === cat.id).slice(0, 4),
  })).filter((cat) => cat.items.length > 0)

  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading
        title="Places Along the Route"
        subtitle="What's on the way — from OpenStreetMap"
        icon={Signpost}
      />

      {grouped.length === 0 ? (
        <p className="mt-4 text-sm text-forest-500">
          No notable places were found near this route yet.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {grouped.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon]
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 text-sm font-medium text-forest-800">
                  <Icon size={15} style={{ color: cat.color }} />
                  {cat.label}
                </div>
                <ul className="mt-1.5 space-y-1 pl-5">
                  {cat.items.map((place) => (
                    <li key={place.id} className="truncate text-sm text-forest-600">
                      {place.name}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
