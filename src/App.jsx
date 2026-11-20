import { useState } from 'react'
import Header from './components/Header'
import SearchPanel from './components/SearchPanel'
import RouteSummary from './components/RouteSummary'
import TravelOptions from './components/TravelOptions'
import RouteMap from './components/RouteMap'
import TrekTrailNotice from './components/TrekTrailNotice'
import TrekOverview from './components/TrekOverview'
import WeatherPanel from './components/WeatherPanel'
import AIAnalysis from './components/AIAnalysis'
import PlacesAlongRoute from './components/PlacesAlongRoute'
import PlacesToVisit from './components/PlacesToVisit'
import FoodAndRestaurants from './components/FoodAndRestaurants'
import WhereToStay from './components/WhereToStay'
import NearbyFoodStay from './components/NearbyFoodStay'
import EquipmentRecommendations from './components/EquipmentRecommendations'
import SafetyPanel from './components/SafetyPanel'
import Footer from './components/Footer'

import { geocodeLocation, reverseGeocode } from './services/geocodingService'
import { getRoute } from './services/routingService'
import { getWeather, getElevations } from './services/weatherService'
import {
  getPlacesAlongRoute,
  getNearbyAttractions,
  getNearbyRestaurants,
  getNearbyHotels,
  getNearbyServices,
} from './services/placesService'
import { classifyDestination } from './services/destinationTypeService'
import { analyzeTrek, generateEquipmentRecommendations, generateSafetyInsights } from './utils/aiAnalysis'
import { computeTravelOptions, computeTrailheadOptions } from './utils/travelOptions'

const ACTIVITY_LABEL = { trek: 'trek', peak: 'trek', hill: 'hike', nature: 'outdoor visit' }
const ANALYSIS_TITLE = {
  trek: 'AI Trek Analysis',
  peak: 'AI Trek Analysis',
  hill: 'AI Hike Analysis',
  nature: 'AI Outdoor Analysis',
}

export default function App() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [currentLocation, setCurrentLocation] = useState(null) // { lat, lon, label }
  const [sourceSuggestion, setSourceSuggestion] = useState(null) // geocode result the user picked from autocomplete
  const [destSuggestion, setDestSuggestion] = useState(null)
  const [locating, setLocating] = useState(false)
  const [loadingStep, setLoadingStep] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location access. Please type a starting location instead.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const label = await reverseGeocode(latitude, longitude)
        setCurrentLocation({ lat: latitude, lon: longitude, label })
        setFrom(label)
        setLocating(false)
      },
      () => {
        setError('Location permission was denied. Please type a starting location instead.')
        setLocating(false)
      }
    )
  }

  async function handlePlanTrek() {
    if (!to.trim()) {
      setError('Please enter a destination.')
      return
    }
    if (!from.trim() && !currentLocation) {
      setError('Please enter a starting location, or use your current location.')
      return
    }

    setError(null)
    setResult(null)

    try {
      // 1. Resolve source + destination coordinates. If the user picked a
      // suggestion from the autocomplete dropdown (or used their current
      // location), reuse those exact coordinates instead of re-geocoding —
      // faster, and guarantees we route to what they actually selected.
      setLoadingStep('geocode')
      const useCurrentLocation = currentLocation && from === currentLocation.label
      let sourcePoint
      let sourceName
      if (useCurrentLocation) {
        sourcePoint = { lat: currentLocation.lat, lon: currentLocation.lon }
        sourceName = currentLocation.label
      } else if (sourceSuggestion && from === sourceSuggestion.displayName.split(',')[0].trim()) {
        sourcePoint = { lat: sourceSuggestion.lat, lon: sourceSuggestion.lon }
        sourceName = sourceSuggestion.displayName
      } else {
        const sourceGeocode = await geocodeLocation(from, 'source')
        sourcePoint = { lat: sourceGeocode.lat, lon: sourceGeocode.lon }
        sourceName = sourceGeocode.displayName
      }

      let destGeocode
      if (destSuggestion && to === destSuggestion.displayName.split(',')[0].trim()) {
        destGeocode = destSuggestion
      } else {
        destGeocode = await geocodeLocation(to, 'destination')
      }
      const destPoint = { lat: destGeocode.lat, lon: destGeocode.lon }

      // 1b. What KIND of destination is this? Combines a curated known-trek
      // list, the user's own search words, and OpenStreetMap's real
      // category tags — never assumes every search is a trek, and never
      // leaves an ordinary city unclassified either.
      const destinationType = classifyDestination(to, destGeocode)

      // 2. Real road route between the two points.
      setLoadingStep('route')
      const route = await getRoute(sourcePoint, destPoint)
      const travelOptions = destinationType.trekEligible
        ? computeTrailheadOptions(route)
        : computeTravelOptions(route)

      // 3. Destination weather + elevation for both points.
      setLoadingStep('weather')
      const [weather, elevations] = await Promise.all([
        getWeather(destPoint.lat, destPoint.lon),
        getElevations([sourcePoint, destPoint]),
      ])
      const [sourceElevationM, destElevationM] = elevations

      // 4. Places sampled along the ENTIRE route corridor (real distance
      // to the route line, not just "near a sample point").
      setLoadingStep('places')
      const routePlaces = await getPlacesAlongRoute(route.geometry)

      // 5. Mode-specific data. A city/tourist destination gets a real
      // destination guide; a trek/hill/nature destination gets the AI
      // analysis, equipment, and safety cards — never both, never fabricated.
      setLoadingStep('analysis')
      let analysis = null
      let equipment = null
      let safetyCards = null
      let nearbyServices = []
      let attractions = []
      let restaurants = []
      let hotels = []

      if (destinationType.trekEligible) {
        const activityLabel = ACTIVITY_LABEL[destinationType.category] || 'trek'
        analysis = analyzeTrek({
          distanceKm: route.distanceKm,
          durationHours: route.durationHours,
          sourceElevationM,
          destElevationM,
          weather,
          activityLabel,
        })
        equipment = generateEquipmentRecommendations({
          weather,
          destElevationM,
          distanceKm: route.distanceKm,
        })
        safetyCards = generateSafetyInsights({
          weather,
          destElevationM,
          distanceKm: route.distanceKm,
          scores: analysis.scores,
        })
        nearbyServices = await getNearbyServices(destPoint)
      } else {
        ;[attractions, restaurants, hotels] = await Promise.all([
          getNearbyAttractions(destPoint),
          getNearbyRestaurants(destPoint),
          getNearbyHotels(destPoint),
        ])
      }

      setResult({
        sourceName,
        destName: destGeocode.displayName,
        destinationType,
        source: [sourcePoint.lat, sourcePoint.lon],
        destination: [destPoint.lat, destPoint.lon],
        route,
        travelOptions,
        weather,
        destElevationM,
        sourceElevationM,
        routePlaces,
        analysis,
        equipment,
        safetyCards,
        nearbyServices,
        attractions,
        restaurants,
        hotels,
      })
    } catch (err) {
      setError(err.message || 'Something went wrong while planning this trip. Please try again.')
    } finally {
      setLoadingStep(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <Header />

      <div id="plan">
        <SearchPanel
          from={from}
          to={to}
          onFromChange={(v) => {
            setFrom(v)
            if (currentLocation && v !== currentLocation.label) setCurrentLocation(null)
            if (sourceSuggestion && v !== sourceSuggestion.displayName.split(',')[0].trim()) {
              setSourceSuggestion(null)
            }
          }}
          onToChange={(v) => {
            setTo(v)
            if (destSuggestion && v !== destSuggestion.displayName.split(',')[0].trim()) {
              setDestSuggestion(null)
            }
          }}
          onSelectSource={(s) => {
            setSourceSuggestion(s)
            setCurrentLocation(null)
          }}
          onSelectDestination={setDestSuggestion}
          onUseCurrentLocation={handleUseCurrentLocation}
          onSubmit={handlePlanTrek}
          locating={locating}
          loadingStep={loadingStep}
          error={error}
          compact={!!result}
        />
      </div>

      {result && (result.destinationType.trekEligible ? (
        <TrekDashboard result={result} />
      ) : (
        <CityDashboard result={result} />
      ))}

      <Footer />
    </div>
  )
}

/** Section order per spec: Search → Trek Overview → Travel to Trailhead →
 * Trek Route/Map → Weather → AI Analysis → Equipment → Safety → Nearby
 * Food & Stay. */
function TrekDashboard({ result }) {
  return (
    <>
      <RouteSummary sourceName={result.sourceName} destName={result.destName} destinationType={result.destinationType} />

      <section className="mx-auto max-w-6xl px-5 py-8">
        <TrekOverview
          destName={result.destName}
          route={result.route}
          destElevationM={result.destElevationM}
          elevationGainM={result.analysis.elevationGainM}
          difficultyLevel={result.analysis.difficultyLevel}
        />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <TravelOptions title="Travel to Trailhead" options={result.travelOptions} />
      </section>

      <section id="route" className="mx-auto max-w-6xl px-5 pb-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RouteMap
              source={result.source}
              destination={result.destination}
              geometry={result.route.geometry}
              places={result.routePlaces}
            />
            <TrekTrailNotice />
          </div>
          <div id="ai-analysis">
            <AIAnalysis analysis={result.analysis} title={ANALYSIS_TITLE[result.destinationType.category]} />
          </div>
        </div>
      </section>

      <section id="weather" className="mx-auto max-w-6xl px-5 pb-8">
        <WeatherPanel weather={result.weather} destName={result.destName} />
      </section>

      <section id="equipment" className="mx-auto max-w-6xl px-5 pb-8">
        <EquipmentRecommendations items={result.equipment} />
      </section>

      <section id="safety" className="mx-auto max-w-6xl px-5 pb-8">
        <SafetyPanel cards={result.safetyCards} />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <NearbyFoodStay places={result.nearbyServices} destName={result.destName} />
      </section>
    </>
  )
}

/** Section order per spec: Search → Travel Summary → Travel Options →
 * Route Map → Top Places to Visit → Food & Restaurants → Where to Stay →
 * Places Along Route → Destination Weather. */
function CityDashboard({ result }) {
  return (
    <>
      <RouteSummary sourceName={result.sourceName} destName={result.destName} destinationType={result.destinationType} />

      <section className="mx-auto max-w-6xl px-5 py-8">
        <TravelOptions options={result.travelOptions} />
      </section>

      <section id="route" className="mx-auto max-w-6xl px-5 pb-8">
        <RouteMap
          source={result.source}
          destination={result.destination}
          geometry={result.route.geometry}
          places={result.routePlaces}
        />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <PlacesToVisit places={result.attractions} destName={result.destName} />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <FoodAndRestaurants places={result.restaurants} destName={result.destName} />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <WhereToStay places={result.hotels} destName={result.destName} />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <PlacesAlongRoute places={result.routePlaces} />
      </section>

      <section id="weather" className="mx-auto max-w-6xl px-5 pb-16">
        <WeatherPanel weather={result.weather} destName={result.destName} />
      </section>
    </>
  )
}
