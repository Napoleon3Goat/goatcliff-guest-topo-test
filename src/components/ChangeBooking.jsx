import { useState } from 'react'
import Calendar from './Calendar'
import { getActivity, rescheduleBooking, cancelBooking } from '../lib/api'
import { addDays, formatDate, peso, todayManila } from '../lib/dates'
import { isCamping } from '../lib/pricing'
import { friendlyError } from '../lib/errors'
import { FACEBOOK_PAGE } from './PaymentStep'

// Reschedule or cancel, shown under "Check my booking".
// To make a change the guest also types:
//   1. the mobile number they booked with (3rd check, on top of reference + email)
//   2. their reference number again (so nobody changes a booking by accident)
// The database checks everything again: 2 days before the visit, new date by Dec 31, free dates only.
// onChanged(message) is called after a change, with the message to show the guest.
export default function ChangeBooking({ booking, email, onChanged }) {
  const [mode, setMode] = useState('') // '', 'reschedule' or 'cancel'
  const [mobile, setMobile] = useState('')
  const [typedRef, setTypedRef] = useState('')
  const [activity, setActivity] = useState(null) // for the calendar
  const [newDate, setNewDate] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const today = todayManila()
  const year = booking.visit_date.slice(0, 4)
  const nights = booking.nights || 1

  // The booking's own nights, and the nights of the new date
  const myNights = Array.from({ length: nights }, (_, i) => addDays(booking.visit_date, i))
  const newNights = newDate ? Array.from({ length: nights }, (_, i) => addDays(newDate, i)) : []
  const blockedNight = activity && isCamping(activity) && availability
    ? newNights.find((d) => availability.taken.includes(d) || availability.closed.includes(d))
    : null

  // Less than 2 days before the visit: no online changes
  if (booking.visit_date < addDays(today, 2)) {
    return <p className="note">Your visit is less than 2 days away, so it can't be changed online. Please message us on Facebook ({FACEBOOK_PAGE}).</p>
  }

  async function open(which) {
    setMode(which)
    setError('')
    if (which === 'reschedule' && !activity) {
      try {
        setActivity(await getActivity(booking.activity_code))
      } catch (e) {
        setError(friendlyError(e))
      }
    }
  }

  // The same checks the database does, so the guest sees the problem right away
  function checkTyped() {
    const digits = mobile.replace(/[^0-9]/g, '')
    if (!/^09\d{9}$/.test(digits)) return 'Enter the 11-digit mobile number you booked with (09…).'
    if (typedRef.trim().toUpperCase() !== booking.reference_number) return `Type your reference number, ${booking.reference_number}, to confirm.`
    return ''
  }

  async function saveReschedule(e) {
    e.preventDefault()
    if (!newDate) return setError('Pick the new date on the calendar.')
    if (blockedNight) return setError(`The area isn't free on ${formatDate(blockedNight)}. Pick another date.`)
    const problem = checkTyped()
    if (problem) return setError(problem)
    setBusy(true); setError('')
    try {
      await rescheduleBooking(booking.reference_number, email, mobile, newDate)
      onChanged(`Done! Your booking is moved to ${formatDate(newDate)}. Your reference number stays ${booking.reference_number}.`)
    } catch (err) {
      setError(friendlyError(err))
      setBusy(false)
    }
  }

  async function saveCancel(e) {
    e.preventDefault()
    const problem = checkTyped()
    if (problem) return setError(problem)
    setBusy(true); setError('')
    try {
      const refund = await cancelBooking(booking.reference_number, email, mobile, reason)
      onChanged(refund > 0
        ? `Your booking is cancelled. Goat Cliff will contact you to arrange your refund of ${peso(refund)}. Refunds usually take 2–5 business days.`
        : 'Your booking is cancelled.')
    } catch (err) {
      setError(friendlyError(err))
      setBusy(false)
    }
  }

  // The two boxes both changes need
  const confirmBoxes = (
    <>
      <label>
        Mobile number you booked with
        <input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="09XX XXX XXXX" />
      </label>
      <label>
        Type your reference number to confirm
        <input value={typedRef} onChange={(e) => setTypedRef(e.target.value)} autoCapitalize="characters" placeholder={booking.reference_number} />
      </label>
    </>
  )

  return (
    <div className="change-booking">
      <h3>Change this booking</h3>
      <p className="hint">Online changes: at least 2 days before your visit. New dates up to December 31, {year}. Rescheduling is free.</p>

      {!mode && (
        <div className="actions">
          <button className="btn-secondary" onClick={() => open('reschedule')}>Reschedule</button>
          <button className="btn-secondary" onClick={() => open('cancel')}>Cancel booking</button>
        </div>
      )}

      {mode === 'reschedule' && (
        <form className="form" onSubmit={saveReschedule}>
          <h4>Pick your new {isCamping(activity || {}) ? 'check-in date' : 'date'}</h4>
          {activity && (
            <Calendar
              activity={activity}
              selected={newDate}
              range={newNights}
              mine={myNights}
              minDate={addDays(today, 2)}
              maxDate={`${year}-12-31`}
              onSelect={(d, avail) => { setNewDate(d); setAvailability(avail) }}
              onAvailability={setAvailability}
            />
          )}
          {newDate && <p className="selection">New date: <strong>{formatDate(newDate)}</strong>{nights > 1 ? ` (${nights} nights)` : ''}</p>}
          {confirmBoxes}
          {error && <span className="field-error" role="alert">{error}</span>}
          <div className="actions">
            <button type="button" className="btn-secondary" onClick={() => { setMode(''); setError('') }}>Back</button>
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Move my booking'}</button>
          </div>
        </form>
      )}

      {mode === 'cancel' && (
        <form className="form" onSubmit={saveCancel}>
          <h4>Cancel your booking</h4>
          <p>If you paid a down payment, Goat Cliff will contact you to arrange your refund. Refunds usually take 2–5 business days.</p>
          <label>
            Reason <span className="hint">(optional)</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} />
          </label>
          {confirmBoxes}
          {error && <span className="field-error" role="alert">{error}</span>}
          <div className="actions">
            <button type="button" className="btn-secondary" onClick={() => { setMode(''); setError('') }}>Back</button>
            <button className="btn-danger" disabled={busy}>{busy ? 'Cancelling…' : 'Cancel my booking'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
