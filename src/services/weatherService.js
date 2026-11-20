import { describeWeatherCode } from '../data/weatherCodes'

// Open-Meteo is free and requires no API key for non-commercial use, which
// is why it's used here instead of a key-gated provider.
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation'

/**
 * Fetches current conditions plus a short daily forecast for a destination.
 * @returns {Promise<{
 *   temperature:number, feelsLike:number, precipitationProbability:number,
 *   windSpeed:number, condition:string, isWet:boolean,
 *   forecast: {date:string, max:number, min:number, rainChance:number, condition:string}[]
 * }>}
 */
export async function getWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '4',
  })

  let response
  try {
    response = await fetch(`${FORECAST_URL}?${params.toString()}`)
  } catch (err) {
    throw new Error('Could not reach the weather service. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Weather data is unavailable for this destination right now.')
  }

  const data = await response.json()
  const current = data.current
  const weatherInfo = describeWeatherCode(current.weather_code)

  // Open-Meteo's "current" block doesn't include a rain-probability
  // percentage, so today's daily max value is used as the best available
  // estimate of rain probability for the next several hours.
  const rainProbability = data.daily?.precipitation_probability_max?.[0] ?? 0

  const forecast = (data.daily?.time || []).map((date, i) => ({
    date,
    max: data.daily.temperature_2m_max[i],
    min: data.daily.temperature_2m_min[i],
    rainChance: data.daily.precipitation_probability_max[i],
    condition: describeWeatherCode(data.daily.weather_code[i]).label,
  }))

  return {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    precipitationProbability: rainProbability,
    windSpeed: current.wind_speed_10m,
    condition: weatherInfo.label,
    isWet: weatherInfo.wet || rainProbability >= 50,
    forecast,
  }
}

/**
 * Batches elevation lookups for multiple points in a single request.
 * @param {{lat:number, lon:number}[]} points
 * @returns {Promise<number[]>} elevation in meters, same order as input
 */
export async function getElevations(points) {
  const lats = points.map((p) => p.lat).join(',')
  const lons = points.map((p) => p.lon).join(',')
  const url = `${ELEVATION_URL}?latitude=${lats}&longitude=${lons}`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('elevation lookup failed')
    const data = await response.json()
    return data.elevation || points.map(() => 0)
  } catch {
    // Elevation is used to enrich the AI analysis, not required for the
    // dashboard to function — fall back to zero rather than blocking.
    return points.map(() => 0)
  }
}
