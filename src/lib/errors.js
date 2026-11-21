// Turns database errors into messages a guest understands.
// Wording from claude/frontend-recommendations.md.
const MESSAGES = [
  // While a guest pays, their spot is held for 5 minutes, so "taken" can also mean "someone is paying".
  ['no_double_booking_camping', 'Someone just booked this area, or is paying for it right now. Try again in 5 minutes, or pick another area or date.'],
  ['DAY_FULL', 'That day is full for the rock activity, or someone is paying for the last spots right now. Try again in 5 minutes, or pick another date.'],
  ['DATE_CLOSED', 'Goat Cliff is closed on that date.'],
  ['TENTS_FULL', 'Not enough tents left on one of those nights. Try again in 5 minutes, or book without tents.'],
  ['consent_given_at', 'Please tick "I agree to the Privacy Notice and Booking Terms" before booking.'],
  // Payment proof (submit_payment)
  ['TIME_UP', 'TIME_UP'], // the payment page shows its own "time's up" note
  ['ALREADY_SENT', 'Your payment proof was already sent. Goat Cliff will check it.'],
  ['payments_transaction_reference_key', 'That reference number was already used for another booking. Check your receipt and type the reference again.'],
  ['NO_REFERENCE', 'Enter the reference number from your receipt.'],
  ['BAD_REFERENCE', 'That reference number is too long. Check your receipt.'],
  ['RECEIPT_UPLOAD', 'The screenshot didn\'t upload. Check your internet and try again (JPG, PNG or WebP, up to 5 MB).'],
  // Reschedule / cancel (guest_reschedule, guest_cancel)
  ['NOT_FOUND: the reference number, email and mobile', 'That mobile number doesn\'t match this booking. Use the number you booked with.'],
  ['NO_REFUND_ACCOUNT', 'Choose GCash or Maya for your refund.'],
  ['BAD_REFUND_ACCOUNT', 'Enter the 11-digit GCash or Maya number for your refund (09…).'],
  ['TOO_LATE', 'Your visit is less than 2 days away, so it can\'t be changed online. Please message us on Facebook.'],
  ['finish paying', 'Finish paying for this booking first.'],
  ['NOT_ACTIVE', 'This booking can\'t be changed online anymore. Please message us on Facebook.'],
  ['BAD_DATE: pick a different', 'Pick a different date.'],
  ['BAD_DATE: the new date must be at least', 'The new date must be at least 2 days from today.'],
  ['BAD_DATE', 'The new date must be on or before December 31 of your visit\'s year.'],
  ['NOT_FOUND', 'We couldn\'t find this booking. Please start again.'],
  ['check constraint', 'Some of the numbers in your form don\'t add up. Please check the group size and discount counts.'],
]

export function friendlyError(error) {
  const text = error?.message || String(error || '')
  const match = MESSAGES.find(([code]) => text.includes(code))
  if (match) return match[1]
  if (text.toLowerCase().includes('fetch')) return 'Can\'t reach the server. Check your internet connection and try again.'
  return 'Something went wrong. Please try again.'
}
