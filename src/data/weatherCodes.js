// Open-Meteo returns WMO weather codes (numbers). This maps each code to a
// human-readable label and a rough "precipitation-ish" flag used by the AI
// analysis engine to judge weather risk beyond just the rain-probability
// number.
export const WEATHER_CODES = {
  0: { label: 'Clear sky', wet: false },
  1: { label: 'Mainly clear', wet: false },
  2: { label: 'Partly cloudy', wet: false },
  3: { label: 'Overcast', wet: false },
  45: { label: 'Fog', wet: false },
  48: { label: 'Depositing rime fog', wet: false },
  51: { label: 'Light drizzle', wet: true },
  53: { label: 'Moderate drizzle', wet: true },
  55: { label: 'Dense drizzle', wet: true },
  56: { label: 'Light freezing drizzle', wet: true },
  57: { label: 'Dense freezing drizzle', wet: true },
  61: { label: 'Slight rain', wet: true },
  63: { label: 'Moderate rain', wet: true },
  65: { label: 'Heavy rain', wet: true },
  66: { label: 'Light freezing rain', wet: true },
  67: { label: 'Heavy freezing rain', wet: true },
  71: { label: 'Slight snow fall', wet: true },
  73: { label: 'Moderate snow fall', wet: true },
  75: { label: 'Heavy snow fall', wet: true },
  77: { label: 'Snow grains', wet: true },
  80: { label: 'Slight rain showers', wet: true },
  81: { label: 'Moderate rain showers', wet: true },
  82: { label: 'Violent rain showers', wet: true },
  85: { label: 'Slight snow showers', wet: true },
  86: { label: 'Heavy snow showers', wet: true },
  95: { label: 'Thunderstorm', wet: true },
  96: { label: 'Thunderstorm with slight hail', wet: true },
  99: { label: 'Thunderstorm with heavy hail', wet: true },
}

export function describeWeatherCode(code) {
  return WEATHER_CODES[code] || { label: 'Unknown', wet: false }
}
