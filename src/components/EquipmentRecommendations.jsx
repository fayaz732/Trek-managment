import { Backpack, CheckCircle2 } from 'lucide-react'
import SectionHeading from './SectionHeading'

export default function EquipmentRecommendations({ items }) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <SectionHeading
        title="AI Recommended Equipment"
        subtitle="Generated from this destination's real weather and elevation data"
        icon={Backpack}
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ item, reason }) => (
          <div key={item} className="rounded-xl border border-forest-100 p-4">
            <CheckCircle2 size={16} className="text-forest-500" />
            <p className="mt-2.5 text-sm font-semibold text-forest-900">{item}</p>
            <p className="mt-1 text-xs text-forest-500">{reason}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
