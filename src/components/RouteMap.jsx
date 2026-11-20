import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  UtensilsCrossed,
  Fuel,
  BedDouble,
  Cross,
  Camera,
  SquareParking,
  MapPin,
  Mountain,
} from 'lucide-react'
import { PLACE_CATEGORIES, getCategory } from '../data/placeCategories'
import SectionHeading from './SectionHeading'

const CATEGORY_ICONS = { UtensilsCrossed, Fuel, BedDouble, Cross, Camera, SquareParking }

const sourceIcon = new L.DivIcon({
  html: `<div style="background:#33583c;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const destIcon = new L.DivIcon({
  html: `<div style="background:#a9843f;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
})

function placeIcon(color) {
  return new L.DivIcon({
    html: `<div style="background:${color};width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.35)"></div>`,
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}

/** Adjusts the map viewport to fit the full route once it's available. */
function FitToRoute({ geometry }) {
  const map = useMap()
  useEffect(() => {
    if (geometry && geometry.length > 1) {
      map.fitBounds(L.latLngBounds(geometry), { padding: [30, 30] })
    }
  }, [geometry, map])
  return null
}

export default function RouteMap({ source, destination, geometry, places }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const visiblePlaces =
    activeCategory === 'all' ? places : places.filter((p) => p.category === activeCategory)

  const categoriesWithResults = PLACE_CATEGORIES.filter((cat) =>
    places.some((p) => p.category === cat.id)
  )

  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading title="Route Map" subtitle="Real roads via OpenStreetMap — this is the road journey, not the hiking trail itself." />
      </div>

      {categoriesWithResults.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-forest-700 text-white'
                : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
            }`}
          >
            All
          </button>
          {categoriesWithResults.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-forest-700 text-white'
                  : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl">
        <MapContainer center={source} zoom={7} scrollWheelZoom style={{ height: '420px', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToRoute geometry={geometry} />

          {geometry && geometry.length > 1 && (
            <Polyline positions={geometry} pathOptions={{ color: '#33583c', weight: 4 }} />
          )}

          <Marker position={source} icon={sourceIcon}>
            <Popup>
              <strong>Start</strong>
            </Popup>
          </Marker>
          <Marker position={destination} icon={destIcon}>
            <Popup>
              <strong>Destination</strong>
            </Popup>
          </Marker>

          {visiblePlaces.map((place) => {
            const cat = getCategory(place.category)
            return (
              <Marker key={place.id} position={[place.lat, place.lon]} icon={placeIcon(cat.color)}>
                <Popup>
                  <strong>{place.name}</strong>
                  <br />
                  {cat.label}
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-forest-500">
        <span className="flex items-center gap-1.5">
          <MapPin size={12} className="text-forest-700" /> Start
        </span>
        <span className="flex items-center gap-1.5">
          <Mountain size={12} className="text-khaki-500" /> Destination
        </span>
        {categoriesWithResults.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon]
          return (
            <span key={cat.id} className="flex items-center gap-1.5">
              <Icon size={12} style={{ color: cat.color }} /> {cat.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
