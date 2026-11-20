// Generates a Google Maps SEARCH url (not a place-ID deep link, since we
// never have a verified Google place ID for OSM-sourced places). This is
// exactly what Google's own "search" URL scheme is for.
export function googleMapsSearchUrl(name, context = '') {
  const query = context ? `${name}, ${context}` : name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
