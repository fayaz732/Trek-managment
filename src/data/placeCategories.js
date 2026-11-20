// Each category defines how to query OpenStreetMap (via Overpass) for that
// kind of place, plus how to label/color/icon it in the UI. Keeping this in
// one place means the map filter bar, the markers, and the Overpass query
// all stay in sync.
export const PLACE_CATEGORIES = [
  {
    id: 'food',
    label: 'Food',
    icon: 'UtensilsCrossed',
    color: '#a9843f',
    overpassSelector: '["amenity"~"restaurant|cafe|fast_food"]',
  },
  {
    id: 'fuel',
    label: 'Fuel',
    icon: 'Fuel',
    color: '#456e7d',
    overpassSelector: '["amenity"="fuel"]',
  },
  {
    id: 'hotel',
    label: 'Hotels',
    icon: 'BedDouble',
    color: '#294730',
    overpassSelector: '["tourism"~"hotel|guest_house|hostel"]',
  },
  {
    id: 'hospital',
    label: 'Hospitals',
    icon: 'Cross',
    color: '#b0453f',
    overpassSelector: '["amenity"~"hospital|clinic"]',
  },
  {
    id: 'attraction',
    label: 'Attractions',
    icon: 'Camera',
    color: '#5b8c9e',
    overpassSelector: '["tourism"~"attraction|viewpoint"]',
  },
  {
    id: 'parking',
    label: 'Parking',
    icon: 'SquareParking',
    color: '#8fae95',
    overpassSelector: '["amenity"="parking"]',
  },
]

export function getCategory(id) {
  return PLACE_CATEGORIES.find((c) => c.id === id)
}
