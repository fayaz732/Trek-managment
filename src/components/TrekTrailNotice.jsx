import { Car, Footprints } from 'lucide-react'

export default function TrekTrailNotice() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex items-start gap-3 rounded-xl border border-forest-100 bg-forest-50 p-4">
        <Car size={18} className="mt-0.5 shrink-0 text-forest-600" />
        <div>
          <p className="text-sm font-semibold text-forest-900">Road Journey</p>
          <p className="mt-1 text-xs text-forest-600">
            The route and map above show the real road journey to this destination — not the
            hiking trail itself.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-forest-100 bg-khaki-50 p-4">
        <Footprints size={18} className="mt-0.5 shrink-0 text-khaki-500" />
        <div>
          <p className="text-sm font-semibold text-forest-900">Trek Trail</p>
          <p className="mt-1 text-xs text-forest-600">
            Trek trail geometry isn't available from a free public source for this destination, so
            it isn't shown on the map — the AI analysis below uses elevation and weather data
            instead of a trail track.
          </p>
        </div>
      </div>
    </div>
  )
}
