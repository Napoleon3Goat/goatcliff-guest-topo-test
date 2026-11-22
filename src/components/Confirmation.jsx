import { Link } from 'react-router-dom'
import { addDays, formatDate, peso } from '../lib/dates'
import { isCamping, TENTS } from '../lib/pricing'

// The receipt shown after the guest sends their payment proof.
export default function Confirmation({ booking, activity, form, payment }) {
  const camping = isCamping(activity)
  const checkout = camping ? addDays(booking.visit_date, booking.nights) : null

  return (
    <div className="card center">
      <div className="check-mark">✓</div>
      <h1>Receipt</h1>
      <p className="muted">Booking reference</p>
      <p className="reference">{booking.reference_number}</p>
      {booking.failedPhotos > 0 && (
        <p className="error" role="alert">{booking.failedPhotos} ID photo{booking.failedPhotos > 1 ? 's' : ''} didn't upload. Bring the IDs on arrival so the discount can still be checked.</p>
      )}

      <dl className="facts left">
        <dt>Activity</dt><dd>{camping ? `Camping area ${activity.code}` : activity.name}</dd>
        <dt>{camping ? 'Check-in' : 'Date'}</dt><dd>{formatDate(booking.visit_date)}{camping ? ', 1:00–6:00 PM' : ''}</dd>
        {camping && <><dt>Check-out</dt><dd>{formatDate(checkout)}, 12:00 noon ({booking.nights} night{booking.nights > 1 ? 's' : ''})</dd></>}
        {camping && form.tents4 + form.tents2 > 0 && (
          <><dt>Tents</dt><dd>{Object.entries(TENTS).filter(([k]) => form[k] > 0).map(([k, t]) => `${form[k]} × ${t.label.toLowerCase()}`).join(', ')}</dd></>
        )}
        <dt>Group</dt><dd>{booking.group_size} {booking.group_size > 1 ? 'people' : 'person'}{booking.viewing_count ? `, ${booking.viewing_count} viewing only` : ''}</dd>
        <dt>Total</dt><dd>{peso(booking.total_amount)}</dd>
        <dt>Down payment</dt><dd>{peso(payment?.amount ?? booking.amount_due)}{payment ? ` via ${payment.method}` : ''}</dd>
        {payment && <><dt>Payment reference</dt><dd className="pay-ref">{payment.transaction}</dd></>}
        {payment && <><dt>Sent on</dt><dd>{new Date(payment.sentAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</dd></>}
        <dt>Pay on arrival</dt><dd>{peso(booking.total_amount - (payment?.amount ?? booking.amount_due))}</dd>
        <dt>Status</dt><dd><span className="status">Booked. Payment sent, Goat Cliff will check it.</span></dd>
      </dl>

      <p className="muted">Keep this reference. To check your booking later, go to Help and enter it with your email.</p>
      <Link to="/help" className="btn-secondary">Check my booking or contact Goat Cliff</Link>
    </div>
  )
}
