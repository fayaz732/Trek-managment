import { MapPin, Mountain, ArrowDown } from 'lucide-react'

export default function RouteSummary({ sourceName, destName, destinationType }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-8">
      <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-forest-800">
            <MapPin size={15} className="text-forest-500" />
            <span className="max-w-[200px] truncate font-medium sm:max-w-sm">{sourceName}</span>
          </div>
          <ArrowDown size={14} className="rotate-[-90deg] text-forest-300" />
          <div className="flex items-center gap-1.5 text-forest-800">
            <Mountain size={15} className="text-forest-500" />
            <span className="max-w-[200px] truncate font-medium sm:max-w-sm">{destName}</span>
          </div>
          {destinationType && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                destinationType.trekEligible ? 'bg-forest-50 text-forest-700' : 'bg-khaki-100 text-khaki-500'
              }`}
            >
              {destinationType.label}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
