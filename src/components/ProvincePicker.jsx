import { useState } from 'react'
import { PROVINCES, EXTRA_PLACES, OTHERS } from '../lib/provinces'

// Province picker: type to search, then pick from the list.
// "Others" opens a box to type the place (for places not on the list, like another country).
// choice = what's picked in the list, other = what's typed under "Others".
export default function ProvincePicker({ choice, other, onChoice, onOther }) {
  const [search, setSearch] = useState('')

  // Keep only the places that contain what was typed ("pang" finds "Pangasinan")
  const words = search.trim().toLowerCase()
  const places = [...EXTRA_PLACES, ...PROVINCES].filter((p) => p.toLowerCase().includes(words))

  return (
    <fieldset className="province">
      <legend>Where are you from? <span className="hint">(optional)</span></legend>

      <label>
        <span className="hint">Search</span>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a province or city" />
      </label>

      <label>
        <span className="hint">Province or city</span>
        <select value={choice} onChange={(e) => onChoice(e.target.value)}>
          <option value="">Choose one</option>
          {places.map((p) => <option key={p} value={p}>{p}</option>)}
          <option value={OTHERS}>Others (type it)</option>
        </select>
      </label>
      {places.length === 0 && <p className="hint">Nothing matches. Pick "Others (type it)".</p>}

      {choice === OTHERS && (
        <label>
          Where are you from?
          <input value={other} onChange={(e) => onOther(e.target.value)} maxLength={60} placeholder="e.g. Japan" />
        </label>
      )}
    </fieldset>
  )
}

// What gets saved in the booking: the picked place, or the typed one under "Others".
export function provinceToSave(choice, other) {
  if (choice === OTHERS) return other.trim() || null
  return choice || null
}
