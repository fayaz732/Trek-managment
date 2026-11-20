import { useState } from 'react'
import { Car, Bike, Bus, TrainFront, Footprints } from 'lucide-react'
import SectionHeading from './SectionHeading'

const ICONS = { Car, Bike, Bus, TrainFront, Footprints }

export default function TravelOptions({ title = 'Travel Options', options }) {
  const firstAvailable = options.findIndex((o) => o.available)
  const [selected, setSelected] = useState(firstAvailable === -1 ? 0 : firstAvailable)

  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading title={title} />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((option, i) => {
          const Icon = ICONS[option.icon] || Car
          const isSelected = i === selected
          return (
            <button
              key={option.mode}
              type="button"
              disabled={!option.available}
              onClick={() => setSelected(i)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                isSelected
                  ? 'border-forest-700 bg-forest-700 text-white'
                  : option.available
                  ? 'border-forest-100 text-forest-700 hover:bg-forest-50'
                  : 'border-forest-100 text-forest-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-semibold">{option.title}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 rounded-xl bg-forest-50 p-4">
        {options[selected]?.available ? (
          <>
            <p className="text-lg font-semibold text-forest-900">{options[selected].durationLabel}</p>
            <p className="mt-0.5 text-xs text-forest-500">
              {options[selected].note}
              {options[selected].estimated && ' · estimated, not a live schedule'}
            </p>
          </>
        ) : (
          <p className="text-sm text-forest-500">{options[selected]?.note || 'Data unavailable'}</p>
        )}
      </div>
    </div>
  )
}
