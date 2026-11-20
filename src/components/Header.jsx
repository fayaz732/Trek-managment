import { useState } from 'react'
import { Menu, X, Mountain } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Plan', href: '#plan' },
  { label: 'Route', href: '#route' },
  { label: 'Weather', href: '#weather' },
  { label: 'AI Analysis', href: '#ai-analysis' },
  { label: 'Safety', href: '#safety' },
  { label: 'Equipment', href: '#equipment' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-forest-100 bg-[#f7f5ef]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#plan" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-khaki-100">
            <Mountain size={18} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block font-display text-lg font-semibold leading-tight text-forest-900">
              AI Trek Explorer
            </span>
            <span className="block text-xs leading-tight text-forest-600">
              Plan any trek, anywhere
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-forest-700 transition-colors hover:text-forest-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          className="rounded-md p-2 text-forest-800 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-forest-100 bg-[#f7f5ef] px-5 pb-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm font-medium text-forest-800 hover:bg-forest-50"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
