import { ShieldAlert, CloudRain, Mountain, Sun, Footprints, Phone } from 'lucide-react'
import SectionHeading from './SectionHeading'

const ICONS = { CloudRain, Mountain, Sun, Footprints, Phone }

const RISK_STYLES = {
  Low: 'bg-forest-50 text-forest-700',
  Medium: 'bg-khaki-100 text-khaki-500',
  High: 'bg-rose-50 text-rose-600',
}

export default function SafetyPanel({ cards }) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading title="Safety Analysis" subtitle="Based on this destination's live conditions" icon={ShieldAlert} />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ key, title, icon, detail, risk }) => {
          const Icon = ICONS[icon]
          return (
            <div key={key} className="rounded-xl border border-forest-100 p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                  <Icon size={16} />
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RISK_STYLES[risk]}`}>
                  {risk} risk
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-forest-900">{title}</p>
              <p className="mt-1 text-sm text-forest-600">{detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
