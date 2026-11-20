import { useEffect, useRef, useState } from 'react'
import { searchSuggestions } from '../services/geocodingService'

const DEBOUNCE_MS = 300

/**
 * A text input backed by live Nominatim suggestions. Deliberately does NOT
 * silently rewrite what the user typed — it only offers a dropdown of real
 * candidate matches (which naturally tolerates small typos, since
 * Nominatim's own search does substring/word matching), and the user picks
 * one or keeps typing their own text.
 */
export default function DestinationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  icon: Icon,
  rightSlot,
  inputClassName = '',
}) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  function fetchSuggestions(text) {
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (text.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const results = await searchSuggestions(text, { signal: controller.signal, limit: 5 })
        setSuggestions(results)
        setActiveIndex(-1)
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)
  }

  function selectSuggestion(s) {
    onChange(s.displayName.split(',')[0].trim())
    onSelect?.(s)
    setOpen(false)
    setSuggestions([])
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault()
        selectSuggestion(suggestions[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <label className="flex items-center gap-2 rounded-xl border border-forest-100 bg-white px-3 py-2.5">
        {Icon && <Icon size={16} className="shrink-0 text-forest-500" />}
        <span className="sr-only">{placeholder}</span>
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            fetchSuggestions(e.target.value)
          }}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className={`w-full text-sm text-forest-900 placeholder:text-forest-400 focus:outline-none ${inputClassName}`}
        />
        {rightSlot}
      </label>

      {open && (loading || suggestions.length > 0) && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-forest-100 bg-white py-1 text-left shadow-lg">
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-xs text-forest-400">Searching...</li>
          )}
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lon}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className={`block w-full truncate px-3 py-2 text-left text-sm ${
                  i === activeIndex ? 'bg-forest-50 text-forest-900' : 'text-forest-700 hover:bg-forest-50'
                }`}
              >
                {s.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
