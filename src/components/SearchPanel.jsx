import { Compass, MapPin, LocateFixed, Navigation, AlertCircle } from 'lucide-react'
import DestinationAutocomplete from './DestinationAutocomplete'

const LOADING_STEPS = [
  { key: 'geocode', label: 'Identifying destination...' },
  { key: 'route', label: 'Calculating route...' },
  { key: 'weather', label: 'Checking weather...' },
  { key: 'places', label: 'Finding useful places...' },
  { key: 'analysis', label: 'Analyzing conditions...' },
]

const EXAMPLES = ['Kudremukh Trek', 'Skandagiri Trek', 'Nandi Hills', 'Mullayanagiri', 'Mysuru']

export default function SearchPanel({
  from,
  to,
  onFromChange,
  onToChange,
  onSelectSource,
  onSelectDestination,
  onUseCurrentLocation,
  onSubmit,
  locating,
  loadingStep,
  error,
  compact,
}) {
  const isLoading = !!loadingStep
  const currentStepIndex = LOADING_STEPS.findIndex((s) => s.key === loadingStep)

  return (
    <div
      className={
        compact
          ? 'border-b border-forest-100 bg-white/95 backdrop-blur'
          : 'relative overflow-hidden bg-forest-900'
      }
    >
      {!compact && (
        <>
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=70"
            alt="Misty forested mountains at sunrise"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/75 to-forest-900/30" />
        </>
      )}

      <div className={compact ? 'mx-auto max-w-6xl px-5 py-4' : 'relative mx-auto max-w-3xl px-5 pb-16 pt-20 text-center md:pb-20 md:pt-28'}>
        {!compact && (
          <>
            <p className="text-sm font-medium tracking-wide text-khaki-200">AI Trek Explorer</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] text-[#f7f5ef] md:text-5xl">
              Plan smarter. Explore farther.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-forest-100">
              Enter any starting point and destination — city trips get a full travel guide, and
              genuine trek/hill/nature destinations get an AI-assisted trek analysis, automatically.
            </p>
          </>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className={
            compact
              ? 'mt-0 flex flex-col gap-2 sm:flex-row sm:items-center'
              : 'mt-8 flex flex-col gap-3 rounded-2xl bg-white/95 p-3 text-left shadow-xl backdrop-blur sm:flex-row sm:items-center'
          }
        >
          <DestinationAutocomplete
            value={from}
            onChange={onFromChange}
            onSelect={onSelectSource}
            placeholder="From — e.g. Bengaluru"
            icon={MapPin}
            rightSlot={
              <button
                type="button"
                onClick={onUseCurrentLocation}
                disabled={locating}
                title="Use my current location"
                className="shrink-0 rounded-md p-1 text-forest-500 hover:bg-forest-50 disabled:opacity-50"
              >
                <LocateFixed size={16} className={locating ? 'animate-pulse' : ''} />
              </button>
            }
          />

          <DestinationAutocomplete
            value={to}
            onChange={onToChange}
            onSelect={onSelectDestination}
            placeholder="Search a trek, city, hill or nature destination"
            icon={Navigation}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-semibold text-[#f7f5ef] transition-colors hover:bg-forest-800 disabled:opacity-60"
          >
            <Compass size={16} />
            {isLoading ? 'Planning...' : 'Plan My Trip'}
          </button>
        </form>

        {!compact && !isLoading && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-forest-300">Examples:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onToChange(example)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-forest-100 transition-colors hover:bg-white/20"
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className={compact ? 'mt-3' : 'mx-auto mt-6 max-w-sm'}>
            <div className="flex items-center gap-2 rounded-xl bg-forest-800/40 px-4 py-2.5 text-sm text-[#f7f5ef]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-khaki-300" />
              {LOADING_STEPS[currentStepIndex]?.label || 'Working...'}
            </div>
            <div className="mt-2 flex gap-1">
              {LOADING_STEPS.map((step, i) => (
                <span
                  key={step.key}
                  className={`h-1 flex-1 rounded-full ${i <= currentStepIndex ? 'bg-khaki-300' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-left text-sm ${
              compact ? 'bg-rose-50 text-rose-700' : 'bg-white/95 text-rose-700'
            }`}
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
