import { FACEBOOK_PAGE } from '../components/PaymentStep'
import CheckBooking from '../components/CheckBooking'

// Guests check a booking with its reference + email. Cancelling or rescheduling still goes
// through Goatcliff (guests can't change bookings online), so the contact details are here too.
export default function Help() {
  return (
    <div className="narrow">
      <h1>Check, cancel or reschedule</h1>

      <CheckBooking />

      <div className="card">
        <h2>Contact Goatcliff</h2>
        <dl className="facts">
          <dt>Facebook</dt><dd>{FACEBOOK_PAGE}</dd>
          <dt>Mobile</dt><dd>09XX XXX XXXX</dd>
          <dt>Where</dt><dd>Tagongtongao, Paoay, Atok, Benguet</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Good to know</h2>
        <ul className="plain-list">
          <li><strong>Reschedule or refund</strong> any time until December 31 of your visit's year, at least 2 days before your visit. Missed your visit? That counts too.</li>
          <li><strong>Reschedules</strong> are free, as many times as you need.</li>
          <li><strong>Refunds</strong> go back by GCash, cash or bank transfer. A down payment nobody claims by year end is kept.</li>
          <li><strong>Discounts</strong> for seniors, PWDs and Atok locals are checked with an ID on arrival.</li>
        </ul>
      </div>
    </div>
  )
}
