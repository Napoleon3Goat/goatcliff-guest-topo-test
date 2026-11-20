import { useEffect, useState } from 'react'
import { peso } from '../lib/dates'
import { getWallets, submitPayment } from '../lib/api'
import { friendlyError } from '../lib/errors'

// TODO: replace with Goatcliff's real Facebook Page name (shown on the Help page).
export const FACEBOOK_PAGE = 'Goat Cliff Rock Adventures and Camping'

const MAX_SCREENSHOT = 5 * 1024 * 1024
const SCREENSHOT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// PAYMENT
// The spot is held for 5 minutes. In that time the guest:
//   1. pays Goat Cliff's GCash or Maya (scan the QR or send to the number)
//   2. types the reference number from their receipt
//   3. attaches a screenshot of the receipt, then taps "I've paid"
// Staff check it later. After 5 minutes the database refuses the proof and the spot opens again.
// (A payment gateway that confirms by itself is planned for January.)
export default function PaymentStep({ booking, onDone, onStartOver }) {
  const [wallets, setWallets] = useState(null) // Goat Cliff's GCash / Maya details (from the database)
  const [walletError, setWalletError] = useState('')
  const [method, setMethod] = useState('gcash')
  const [reference, setReference] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(secondsUntil(booking.payBefore))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [timeUp, setTimeUp] = useState(false)

  // Load Goat Cliff's GCash / Maya details once
  useEffect(() => {
    getWallets()
      .then((list) => {
        setWallets(list)
        if (list.length > 0) setMethod(list[0].id) // pick the first one that's on
      })
      .catch((e) => setWalletError(friendlyError(e)))
  }, [])

  // Count down once every second
  useEffect(() => {
    const timer = setInterval(() => {
      const left = secondsUntil(booking.payBefore)
      setSecondsLeft(left)
      if (left === 0) setTimeUp(true)
    }, 1000)
    return () => clearInterval(timer)
  }, [booking.payBefore])

  const wallet = wallets ? wallets.find((w) => w.id === method) : null

  function pickScreenshot(e) {
    const file = e.target.files[0] || null
    setError('')
    if (file && !SCREENSHOT_TYPES.includes(file.type)) {
      setReceipt(null)
      return setError('The screenshot must be a JPG, PNG or WebP picture.')
    }
    if (file && file.size > MAX_SCREENSHOT) {
      setReceipt(null)
      return setError('The screenshot is bigger than 5 MB. Please send a smaller one.')
    }
    setReceipt(file)
  }

  async function send(e) {
    e.preventDefault()
    if (reference.trim() === '') return setError('Enter the reference number from your receipt.')
    if (!receipt) return setError('Attach a screenshot of your receipt.')
    if (!wallet) return setError('Choose GCash or Maya.')
    setSending(true)
    setError('')
    try {
      await submitPayment(booking, { method, reference, receipt })
      onDone({ method: wallet.name, transaction: reference.trim(), amount: booking.amount_due, sentAt: new Date().toISOString() })
    } catch (err) {
      const message = friendlyError(err)
      if (message === 'TIME_UP') setTimeUp(true)
      else setError(message)
      setSending(false)
    }
  }

  if (timeUp) {
    return (
      <div className="card">
        <h2>Time's up</h2>
        <p>The 5 minutes to pay are over, so this spot was released for other guests.</p>
        <p className="note">
          <strong>Already paid?</strong> Start again and enter the same payment proof in the new booking.
          If the date is no longer free, message us on Facebook ({FACEBOOK_PAGE}) with your
          reference number <strong>{booking.reference_number}</strong> and your GCash / Maya reference,
          and we'll refund you or move your date.
        </p>
        <button className="btn-primary block" onClick={onStartOver}>Start again</button>
      </div>
    )
  }

  // Still loading the payment details, or they couldn't load
  if (!wallets || wallets.length === 0) {
    return (
      <div className="card">
        <p className={secondsLeft <= 60 ? 'timer urgent' : 'timer'}>Spot held for you: <strong>{clock(secondsLeft)}</strong></p>
        <h2>Pay the down payment</h2>
        {walletError && <p className="error" role="alert">{walletError}</p>}
        {!walletError && !wallets && <p className="muted">Loading the payment details…</p>}
        {wallets && wallets.length === 0 && (
          <p className="error" role="alert">Online payment isn't available right now. Please message us on Facebook ({FACEBOOK_PAGE}).</p>
        )}
      </div>
    )
  }

  return (
    <form className="card" onSubmit={send}>
      <p className={secondsLeft <= 60 ? 'timer urgent' : 'timer'} role="timer" aria-live="off">
        Spot held for you: <strong>{clock(secondsLeft)}</strong>
      </p>

      <h2>Pay the down payment</h2>
      <p className="big-amount">{peso(booking.amount_due)}</p>

      <fieldset className="pay-methods" disabled={sending}>
        <legend>Pay with</legend>
        {wallets.map((w) => (
          <label key={w.id} className={method === w.id ? 'pay-method on' : 'pay-method'}>
            <input type="radio" name="method" value={w.id} checked={method === w.id} onChange={() => setMethod(w.id)} />
            <span className={'wallet wallet-' + w.id} aria-hidden="true">{w.name}</span>
            <span className="pay-name">{w.name}</span>
          </label>
        ))}
      </fieldset>

      <div className="pay-to">
        {wallet.qrUrl
          ? <img className="qr" src={wallet.qrUrl} alt={`Goat Cliff's ${wallet.name} QR code`} />
          : <p className="qr qr-missing">No QR yet. Send to the number.</p>}
        <dl className="facts">
          <dt>Send to</dt><dd><strong>{wallet.account_number}</strong></dd>
          <dt>Name</dt><dd>{wallet.account_name}</dd>
          <dt>Amount</dt><dd><strong>{peso(booking.amount_due)}</strong></dd>
        </dl>
      </div>

      <ol className="steps">
        <li>Open {wallet.name}, scan the QR or send to the number above.</li>
        <li>Pay exactly <strong>{peso(booking.amount_due)}</strong>.</li>
        <li>Type the reference number and attach a screenshot of your receipt.</li>
      </ol>

      <label>
        Reference number
        <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={40}
          autoComplete="off" placeholder={method === 'gcash' ? '13 digits, e.g. 1234 567 890123' : 'From your Maya receipt'} disabled={sending} />
      </label>

      <label>
        Screenshot of your receipt
        <input type="file" accept={SCREENSHOT_TYPES.join(',')} onChange={pickScreenshot} disabled={sending} />
        <span className="hint">JPG, PNG or WebP, up to 5 MB.</span>
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <button className="btn-primary block" disabled={sending}>
        {sending ? 'Sending…' : "I've paid, send my proof"}
      </button>
    </form>
  )
}

// Seconds left until the time (0 if it already passed)
function secondsUntil(time) {
  return Math.max(0, Math.round((time - Date.now()) / 1000))
}

// 125 seconds -> "2:05"
function clock(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${rest}`
}
