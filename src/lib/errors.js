// Turns database errors into messages a guest understands.
// Wording from claude/frontend-recommendations.md.
const MESSAGES = [
  ['no_double_booking_camping', 'Someone just booked this area for those nights. Please pick another area or date.'],
  ['DAY_FULL', 'That day is full for the rock activity. Please pick another date.'],
  ['DATE_CLOSED', 'Goatcliff is closed on that date.'],
  ['check constraint', 'Some of the numbers in your form don\'t add up. Please check the group size and discount counts.'],
  ['consent_given_at', 'Please tick "I agree to the Privacy Notice and Booking Terms" before booking.'],
]

export function friendlyError(error) {
  const text = error?.message || String(error || '')
  const match = MESSAGES.find(([code]) => text.includes(code))
  if (match) return match[1]
  if (text.toLowerCase().includes('fetch')) return 'Can\'t reach the server. Check your internet connection and try again.'
  return 'Something went wrong. Please try again.'
}
