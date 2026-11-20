import { CloudRain, Wind, Thermometer, Cloud } from 'lucide-react'
import SectionHeading from './SectionHeading'

function dayLabel(dateStr, i) {
  if (i === 0) return 'Today'
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

export default function WeatherPanel({ weather, destName }) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading title="Destination Weather" subtitle={destName} icon={Cloud} />

      <div className="mt-5 flex items-center gap-4 rounded-xl bg-forest-900 p-5 text-[#f7f5ef]">
        <Cloud size={36} className="text-mist-400" />
        <div>
          <p className="font-display text-3xl font-semibold">{Math.round(weather.temperature)}°C</p>
          <p className="text-sm text-forest-200">
            {weather.condition} · Feels like {Math.round(weather.feelsLike)}°C
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-forest-100 p-3">
          <CloudRain size={16} className="text-mist-600" />
          <p className="mt-2 text-sm font-semibold text-forest-900">
            {Math.round(weather.precipitationProbability)}%
          </p>
          <p className="text-xs text-forest-400">Rain chance</p>
        </div>
        <div className="rounded-xl border border-forest-100 p-3">
          <Wind size={16} className="text-mist-600" />
          <p className="mt-2 text-sm font-semibold text-forest-900">{Math.round(weather.windSpeed)} km/h</p>
          <p className="text-xs text-forest-400">Wind speed</p>
        </div>
      </div>

      {weather.forecast?.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {weather.forecast.map((day, i) => (
            <div
              key={day.date}
              className="flex min-w-[72px] flex-1 flex-col items-center rounded-lg bg-forest-50 px-2 py-2.5"
            >
              <p className="text-xs font-medium text-forest-600">{dayLabel(day.date, i)}</p>
              <Thermometer size={13} className="my-1 text-forest-400" />
              <p className="text-xs text-forest-800">
                {Math.round(day.max)}° / {Math.round(day.min)}°
              </p>
              <p className="text-[11px] text-mist-600">{Math.round(day.rainChance)}% rain</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
