import { useState } from 'react'
import { lookupBooking } from '../lib/api'
import { formatDate, addDays, peso } from '../lib/dates'
import { friendlyError } from '../lib/errors'

// "Check my booking": there are no guest logins yet (January), so a guest finds their booking
// with the GC- reference from the receipt plus the email they booked with.
// lookup_booking() only returns a booking when BOTH match, and only these few fields.
const PAYMENT = {
  pending: 'Waiting for the down payment',
  down_payment: 'Down payment received',
  paid: 'Fully paid',
  expired: 'Not paid, booking released',
  refunded: 'Refunded',
}
const VISIT = {
  upcoming: 'Upcoming',
  done: 'Visited',
  failed_to_show: 'Did not arrive',
  cancelled: 'Cancelled',
}

export default function CheckBooking() {
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null) // the booking, or 'none' when nothing matched
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function find(e) {
    e.preventDefault()
    setError(''); setResult(null)
    if (!/^GC-?\w{8}$/i.test(reference.trim())) return setError('Enter the reference from your receipt, like GC-AB12CD34.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter the email you booked with.')
    setBusy(true)
    try {
      const ref = reference.trim().toUpperCase().replace(/^GC-?/, 'GC-')
      setResult((await lookupBooking(ref, email)) || 'none')
    } catch (err) { setError(friendlyError(err)) } finally { setBusy(false) }
  }

  const b = result && result !== 'none' ? result : null
  return (
    <div className="card">
      <h2>Check my booking</h2>
      <form className="form" onSubmit={find}>
        <label>
          Booking reference
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="GC-AB12CD34" autoCapitalize="characters" />
        </label>
        <label>
          Email you booked with
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        {error && <span className="field-error">{error}</span>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Check'}</button>
      </form>

      {result === 'none' && <p className="field-error">No booking matches that reference and email. Check both, or message us on our Facebook Page.</p>}
      {b && (
        <dl className="facts">
          <dt>Reference</dt><dd className="pay-ref">{b.reference_number}</dd>
          <dt>Activity</dt><dd>{b.activity}</dd>
          <dt>{b.nights ? 'Stay' : 'Date'}</dt>
          <dd>{formatDate(b.visit_date)}{b.nights ? ` to ${formatDate(addDays(b.visit_date, b.nights))} (${b.nights} night${b.nights > 1 ? 's' : ''})` : ''}</dd>
          <dt>Group</dt><dd>{b.group_size} {b.group_size > 1 ? 'people' : 'person'}</dd>
          <dt>Total</dt><dd>{peso(b.total_amount)}</dd>
          <dt>Paid</dt><dd>{peso(b.amount_paid)}</dd>
          <dt>Payment</dt><dd>{PAYMENT[b.payment_status] || b.payment_status}</dd>
          <dt>Visit</dt><dd>{VISIT[b.attendance_status] || b.attendance_status}</dd>
        </dl>
      )}
    </div>
  )
}
