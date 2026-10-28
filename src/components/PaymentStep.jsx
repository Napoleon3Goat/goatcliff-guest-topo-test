import { useEffect, useState } from 'react'
import { peso } from '../lib/dates'

// TODO: replace with Goatcliff's real Facebook Page name (shown on the Help page).
export const FACEBOOK_PAGE = 'Goatcliff Adventure and Camping'

// The two e-wallets the guest can pick.
const METHODS = [
  { id: 'gcash', name: 'GCash' },
  { id: 'maya', name: 'Maya' },
]

// PAYMENT (demo version, imitates a payment gateway like Codashop's checkout).
// Real flow planned for 2nd semester:
//   1. the site asks the payment gateway (e.g. PayMongo / Xendit / PayRex) to start a GCash or Maya payment
//   2. the guest is sent to the GCash / Maya page and confirms with MPIN + OTP
//   3. the gateway tells our backend "paid" (a webhook), and the booking is marked paid automatically
// For now steps 1–3 are skipped: choosing a wallet and tapping Pay goes straight to the receipt.
// Nothing is charged and no money moves.
export default function PaymentStep({ booking, onDone, onStartOver }) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(booking.hold_expires_at))
  const [method, setMethod] = useState('gcash')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(secondsUntil(booking.hold_expires_at)), 1000)
    return () => clearInterval(timer)
  }, [booking.hold_expires_at])

  function pay() {
    setPaying(true)
    // Pretend the gateway took a moment, then confirmed the payment.
    setTimeout(() => {
      onDone({
        method: METHODS.find((m) => m.id === method).name,
        transaction: makeTransactionId(),
        amount: booking.amount_due,
        paidAt: new Date().toISOString(),
      })
    }, 1200)
  }

  if (secondsLeft <= 0 && !paying) {
    return (
      <div className="card center">
        <h2>Your 15-minute hold has ended</h2>
        <button className="btn-primary" onClick={onStartOver}>Start over</button>
      </div>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const chosen = METHODS.find((m) => m.id === method).name

  return (
    <div className="card">
      <div className={secondsLeft < 180 ? 'timer urgent' : 'timer'}>
        Spot held for <strong>{minutes}:{seconds}</strong>
      </div>

      <h2>Pay the down payment</h2>
      <p className="big-amount">{peso(booking.amount_due)}</p>

      <fieldset className="pay-methods" disabled={paying}>
        <legend>Pay with</legend>
        {METHODS.map((m) => (
          <label key={m.id} className={method === m.id ? 'pay-method on' : 'pay-method'}>
            <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
            <span className={'wallet wallet-' + m.id} aria-hidden="true">{m.name}</span>
            <span className="pay-name">{m.name}</span>
          </label>
        ))}
      </fieldset>

      <button className="btn-primary block" onClick={pay} disabled={paying}>
        {paying ? `Connecting to ${chosen}…` : `Pay ${peso(booking.amount_due)} with ${chosen}`}
      </button>
    </div>
  )
}

function secondsUntil(iso) {
  return Math.max(0, Math.floor((new Date(iso) - Date.now()) / 1000))
}

// A made-up 13-digit payment reference, like the one GCash or Maya shows.
function makeTransactionId() {
  const digits = crypto.getRandomValues(new Uint8Array(13))
  return Array.from(digits, (d) => d % 10).join('')
}
