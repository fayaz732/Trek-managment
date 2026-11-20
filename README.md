# AI Trek Explorer — City & Trek Dual-Mode Dashboard

Search any starting point and any destination. The dashboard classifies the
destination for real — city/tourist destination, or trek/hill/mountain/
nature — and shows a completely different, purpose-built dashboard for
each. Nothing is fabricated: ratings, prices, trail distance, and bus/train
schedules are shown only when a real source has them, and are otherwise
labeled "Data unavailable" or "Estimated."

No chatbot — search, and the dashboard builds itself.

---

## 1. Install & run

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

Requires an internet connection at runtime.

## 2. APIs / services used

| Purpose | Service | Key? |
|---|---|---|
| Geocoding + autocomplete | Nominatim (OpenStreetMap) | No |
| Road routing (car) | OSRM public demo server | No |
| Weather + elevation | Open-Meteo | No |
| Attractions / restaurants / hotels / route places | Overpass API (OpenStreetMap) | No |
| Destination classification | Local logic (`destinationTypeService.js`) | No |
| Bike/bus/train travel options | Local estimate (`utils/travelOptions.js`), clearly labeled | No |
| AI trek analysis | Local rule-based engine (`utils/aiAnalysis.js`) | No |
| "Open in Google Maps" | Google Maps **search** URL (`utils/googleMaps.js`) — no Maps API/key used | No |

## 3. New components

`SearchPanel` (rebuilt), `DestinationAutocomplete`, `TravelOptions`,
`PlacesToVisit`, `FoodAndRestaurants`, `WhereToStay`, `NearbyFoodStay`,
`TrekOverview`. `RouteSummary` was simplified (distance/time moved into
`TravelOptions`). `NonTrekNotice` was removed — non-trek destinations now
get a full city dashboard instead of a "trek unavailable" message.

New services/utils: `utils/geo.js` (shared haversine + route-distance
helpers), `utils/googleMaps.js`, `utils/travelOptions.js`,
`services/destinationTypeService.js` rewritten, `services/placesService.js`
extended, `services/geocodingService.js` extended with caching +
autocomplete.

## 4. Important logic added

### Destination classification (rewritten)
Three signals, checked in order, real data first:
1. A curated list of known South-Indian trek/peak names (`KNOWN_TREK_NAMES`) — fixes bug B (a bare "Kudremukh" search, with no "Trek" suffix, often geocodes to a village and was previously missed).
2. Keywords in what the user typed ("trek", "hills", "giri", "peak"...).
3. OpenStreetMap's real `class`/`type` tags for the geocoded result — now also treating `class="boundary" type="administrative"` as a city (fixes bug A: many Indian city searches return as an administrative boundary, not `class="place"`, and were falling through to "Other").

If nothing matches, the destination defaults to a **city/tourist dashboard**
(not "Other" left blank) — the safe, useful default.

### Two dashboards, two data pipelines
- **City/tourist mode**: real road route → `TravelOptions` (car/bike/bus/train) → map → `PlacesToVisit` (Overpass, tourism/historic/leisure tags around the destination) → `FoodAndRestaurants` (Overpass, amenity=restaurant/cafe/fast_food around the destination) → `WhereToStay` (Overpass, tourism=hotel/guest_house/hostel around the destination) → `PlacesAlongRoute` (route corridor) → destination weather.
- **Trek mode**: `TrekOverview` (real figures + honest "Data unavailable" for what we don't have) → `TravelOptions` (Road/Bike to Trailhead + Trek Duration, honestly unavailable) → map with `TrekTrailNotice` → weather → `AIAnalysis` → `EquipmentRecommendations` → `SafetyPanel` → `NearbyFoodStay` (Overpass, anchored at the destination/trailhead point, not the source city).

### Places-along-route bug fixed further (bug C)
Built on the previous distance-based sampling fix: every route-corridor
place now also gets a computed `distanceFromRouteKm` (haversine distance to
the nearest of ~200 downsampled route vertices, see `utils/geo.js`), is
**filtered out beyond 6 km from the route**, and the whole list is **sorted
by that distance**. This directly targets bug C (Bengaluru landmarks
showing up for a Bengaluru → Mysuru search) with an explicit corridor
check, not just proximity to a sample point.

### City destination places (bug D)
`getNearbyAttractions` / `getNearbyRestaurants` / `getNearbyHotels` in
`placesService.js` query Overpass **around the destination's own
coordinates** (8 km radius) — completely independent of the route, so a
city with sparse route-corridor data still gets its own attractions/food/
hotels. This is the fix for bug D (city searches returning no attractions).

### Travel Options (replaces the single "distance + time" block)
`utils/travelOptions.js` computes:
- **Car** — real OSRM route, never estimated.
- **Bike** — a labeled estimate (0.92× car time — motorbikes are typically a little faster in mixed Indian traffic, a little slower on pure highway). Not a second routing API call, to keep the app fast and avoid a second point of failure; clearly marked "Estimated," never presented as routed.
- **Bus** — a labeled "Typical duration" estimate from an average intercity bus speed. No real-time schedule API is free/key-free, so this is never presented as a live schedule.
- **Train** — same honest treatment, and only shown at all for distances ≥30 km (a rough proxy for "a direct rail option is plausible"); otherwise "Data unavailable."
- **Trek mode** shows Road/Bike to Trailhead (same real/estimated split) plus **Trek Duration**, honestly marked "Data unavailable" — there's no free trail-duration data source for an arbitrary destination.

### Autocomplete / typo-tolerant search
`DestinationAutocomplete.jsx` + `geocodingService.searchSuggestions()`:
debounced (300 ms), cancels stale in-flight requests via `AbortController`,
full keyboard support (↑ ↓ Enter Esc), click-outside to close. Nominatim's
own search already tolerates small typos and prefix matches ("kudremuk" →
"Kudremukh", "Mysur" → "Mysuru") via its internal search index, so
suggestions surface the right result without the app silently rewriting
what the user typed — they still pick it from the list. **Limitation:**
suggestions only fire from 2+ typed characters (a 1-character query like
"a" would be extremely noisy and pushes on Nominatim's fair-use policy), so
the single-letter test cases in the brief will show no suggestions until a
second character is typed — a deliberate, documented trade-off.

### Google Maps links
Every attraction/restaurant/hotel card has "Open in Google Maps," built as
a **Maps search URL** (`https://www.google.com/maps/search/?api=1&query=...`)
using the place's real name + destination context — never a fabricated
place ID, since OSM-sourced places don't have a verified Google Maps ID.

### Performance
In-memory caching for geocoding/suggestions (`geocodingService.js`),
`AbortController`-based cancellation for autocomplete, and the route
geometry/coordinates are computed once and reused across the map, the
places query, the weather/elevation calls, and the AI analysis — no
duplicate requests per card.

## 5. Bugs fixed (from the brief's list)

| # | Bug | Fix |
|---|---|---|
| A | City misclassified as "Other" | `boundary`/`administrative` now maps to city; unmatched city-like classes default to city, not "other" |
| B | "Kudremukh" (no "Trek" suffix) missed | Curated `KNOWN_TREK_NAMES` list checked first |
| C | Route places clustered near source city | Per-place `distanceFromRouteKm` + 6 km filter + sort |
| D | Some cities got no attractions | New destination-anchored Overpass queries (`getNearbyAttractions/Restaurants/Hotels`), independent of the route |
| E | Only one road duration shown | `TravelOptions` (car/bike/bus/train, or trailhead variant) |
| F | Trek/city dashboards looked the same | Fully separate section order and components per mode (see §4) |

## 6. Data/API limitations (be upfront about these)

- **No free bus/train schedule API** exists without a key — bus and train
  durations are clearly labeled estimates from typical average speeds, not
  fetched timetables. Train is only shown for ≥30 km trips.
- **No bike-specific routing API is called** — bike duration is a labeled
  percentage of the real car time, not a second routed profile, to avoid
  a second point of failure for a secondary number.
- **No real hiking-trail geometry or trail-distance/duration database** —
  `TrekTrailNotice` and `TrekOverview` say so explicitly rather than
  fabricating a trail line or a duration figure.
- **No ratings, review counts, or price levels** are shown for attractions/
  restaurants/hotels — OpenStreetMap doesn't reliably carry this data, and
  it is never invented. Cards show name, category, distance, and a real
  Google Maps search link instead.
- **Overpass and Nominatim are shared public servers** with fair-use rate
  limits; the app fails gracefully (empty sections, friendly errors) rather
  than crashing under load.
- **Autocomplete needs 2+ characters** before it queries — a deliberate,
  documented limit to respect Nominatim's usage policy.

## 7. Test cases to try

1. Bengaluru → Mysuru — city dashboard, attractions/food/hotels near Mysuru, not Bengaluru
2. Bengaluru → Kalaburagi — city dashboard, no trek content
3. Bengaluru → Nandi Hills — trek dashboard (hill), no invented multi-day trek
4. Bengaluru → Kudremukh Trek — trek dashboard, full AI analysis
5. Bengaluru → Mullayanagiri — trek dashboard
6. Bengaluru → Skandagiri — trek dashboard
7. Bengaluru → invalid destination — friendly error
8. "kudremuk" (typo) — autocomplete suggests Kudremukh
9. "Mysur" — autocomplete suggests Mysuru
10. "Bengalur" — autocomplete suggests Bengaluru
11–13. "a" / "g" / "ku" — suggestions appear from 2+ characters (see limitation above)

Run `npm run build` and `npm run dev`, try the cases above on desktop and
mobile, and check the browser console before presenting.
