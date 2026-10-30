import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivities } from '../lib/api'
import { addDays, formatDate, peso } from '../lib/dates'
import { isCamping, isRock, TENTS } from '../lib/pricing'

// The receipt shown after the down payment goes through.
export default function Confirmation({ booking, activity, form, payment }) {
  const camping = isCamping(activity)
  const [rock, setRock] = useState(null)

  // After a camping booking, offer the rock package (a separate booking).
  useEffect(() => {
    if (!camping) return
    getActivities()
      .then((list) => setRock(list.find(isRock) || null))
      .catch(() => setRock(null)) // the offer is optional; hide it if loading fails
  }, [camping])

  // Any day of the stay, check-out day included, can be picked for the rock activity.
  const checkout = camping ? addDays(booking.visit_date, booking.nights) : null

  return (
    <div className="card center">
      <div className="check-mark">✓</div>
      <h1>Receipt</h1>
      <p className="muted">Booking reference</p>
      <p className="reference">{booking.reference_number}</p>

      <dl className="facts left">
        <dt>Activity</dt><dd>{camping ? `Camping area ${activity.code}` : activity.name}</dd>
        <dt>{camping ? 'Check-in' : 'Date'}</dt><dd>{formatDate(booking.visit_date)}{camping ? ', 1:00–6:00 PM' : ''}</dd>
        {camping && <><dt>Check-out</dt><dd>{formatDate(checkout)}, 12:00 noon ({booking.nights} night{booking.nights > 1 ? 's' : ''})</dd></>}
        {camping && form.tents4 + form.tents2 > 0 && (
          <><dt>Tents</dt><dd>{Object.entries(TENTS).filter(([k]) => form[k] > 0).map(([k, t]) => `${form[k]} × ${t.label.toLowerCase()}`).join(', ')}</dd></>
        )}
        <dt>Group</dt><dd>{booking.group_size} {booking.group_size > 1 ? 'people' : 'person'}{booking.viewing_count ? `, ${booking.viewing_count} viewing only` : ''}</dd>
        <dt>Total</dt><dd>{peso(booking.total_amount)}</dd>
        <dt>Paid now</dt><dd>{peso(payment?.amount ?? booking.amount_due)}{payment ? ` via ${payment.method}` : ''}</dd>
        {payment && <><dt>Payment reference</dt><dd className="pay-ref">{payment.transaction}</dd></>}
        {payment && <><dt>Paid on</dt><dd>{new Date(payment.paidAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</dd></>}
        <dt>Pay on arrival</dt><dd>{peso(booking.total_amount - (payment?.amount ?? booking.amount_due))}</dd>
        <dt>Status</dt><dd><span className="status">Confirmed, down payment paid</span></dd>
      </dl>

      {camping && rock && (
        <div className="offer">
          <h3>Add a rock activity?</h3>
          <Link
            to={`/book/${rock.code}`}
            className="btn-primary"
            state={{ prefill: form, minDate: booking.visit_date, maxDate: checkout }}
          >
            Add the Rock Activities Package
          </Link>
        </div>
      )}

      <Link to="/help" className="btn-secondary">Contact Goatcliff</Link>
    </div>
  )
}
