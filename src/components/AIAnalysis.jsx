import { Cpu, Sparkles, Info } from 'lucide-react'
import SectionHeading from './SectionHeading'

const BAR_COLORS = ['#43704c', '#294730', '#5b8c9e', '#a9843f']

export default function AIAnalysis({ analysis, title = 'AI Trek Analysis' }) {
  const { scores, difficultyLevel, insight, disclaimer } = analysis

  const factors = [
    { label: 'Physical Demand', score: scores.physicalDemand },
    { label: 'Elevation Challenge', score: scores.elevationChallenge },
    { label: 'Weather Risk', score: scores.weatherRisk },
    { label: 'Terrain Challenge', score: scores.terrainChallenge },
  ]

  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading title={title} icon={Cpu} />
        <span className="rounded-full bg-khaki-100 px-3 py-1 text-xs font-medium text-khaki-500">
          AI-assisted analysis
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-forest-400">Difficulty</p>
        <p className="font-display text-2xl font-semibold text-forest-900">{difficultyLevel}</p>
      </div>

      <div className="mt-5 space-y-4">
        {factors.map((factor, i) => (
          <div key={factor.label}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-forest-800">{factor.label}</span>
              <span className="text-forest-500">{factor.score}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-forest-50">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${factor.score}%`, backgroundColor: BAR_COLORS[i] }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3 rounded-xl bg-forest-50 p-4">
        <Sparkles size={17} className="mt-0.5 shrink-0 text-forest-600" />
        <p className="text-sm text-forest-700">{insight}</p>
      </div>

      {disclaimer && (
        <div className="mt-3 flex gap-2 px-1">
          <Info size={13} className="mt-0.5 shrink-0 text-forest-400" />
          <p className="text-xs text-forest-400">{disclaimer}</p>
        </div>
      )}
    </div>
  )
}
