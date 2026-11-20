export default function SectionHeading({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon size={19} className="mt-0.5 shrink-0 text-forest-700" />}
      <div>
        <h2 className="font-display text-xl font-semibold text-forest-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-forest-500">{subtitle}</p>}
      </div>
    </div>
  )
}
