// EVERY call to the backend goes through this file.
// It follows claude/frontend-recommendations.md (what the database expects).
import { supabase } from './supabase'
import { addDays } from './dates'

const FIFTEEN_MINUTES = 15 * 60 * 1000

// C10 (consent_given_at) is live in DEV only. Production needs that migration before
// this is switched on there, or every booking would be refused.
export const SEND_CONSENT = true

// ---------- Activities ----------
// Guests automatically get only active activities (database access rule).

export async function getActivities() {
  const { data, error } = await supabase.from('activities').select('*').order('code')
  if (error) throw error
  return (data || []).filter((a) => a.is_active)
}

export async function getActivity(code) {
  const { data, error } = await supabase.from('activities').select('*').eq('code', code).maybeSingle()
  if (error) throw error
  return data && data.is_active ? data : null
}

// ---------- Calendar ----------
// booked_dates() returns only visit_date, nights and people (no names), so guests
// can see what's taken without seeing anyone's details.
// calendar_overrides() (closed days / changed caps) is still a draft in the backend;
// until it exists the calendar simply doesn't show closed days, and the database
// refuses a booking on a closed day with DATE_CLOSED.
export async function getAvailability(activity, fromDate, toDate) {
  const { data, error } = await supabase.rpc('booked_dates', { p_activity_id: activity.id, p_from: fromDate, p_to: toDate })
  if (error) throw error

  const taken = new Set()
  const counts = {}
  for (const row of data || []) {
    if (row.nights) {
      // Camping: taken from visit_date up to visit_date + nights (end day not included)
      for (let i = 0; i < row.nights; i++) taken.add(addDays(row.visit_date, i))
    } else {
      // Rock: add up people per day
      counts[row.visit_date] = (counts[row.visit_date] || 0) + row.people
    }
  }

  const closed = []
  const caps = {}
  const overrides = await supabase.rpc('calendar_overrides', { p_activity_id: activity.id, p_from: fromDate, p_to: toDate })
  if (!overrides.error) {
    for (const o of overrides.data || []) {
      if (o.is_closed) closed.push(o.override_date)
      else if (o.daily_capacity != null) caps[o.override_date] = o.daily_capacity
    }
  }
  return { closed, taken: [...taken], counts, caps }
}

// ---------- Booking ----------
// Guests may only create online, pending, unpaid bookings. They can't read a booking
// back after saving, so the reference number is made here and shown on the
// confirmation screen. No .select() after the insert (it would be refused).

function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return 'GC-' + Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export async function createBooking(b) {
  const row = {
    reference_number: makeReference(),
    activity_id: b.activity_id,
    visit_date: b.visit_date,
    nights: b.nights,
    guest_name: b.guest_name,
    companions_names: b.companions_names,
    contact_number: b.contact_number,
    email: b.email,
    group_size: b.group_size,
    viewing_count: b.viewing_count,
    senior_count: b.senior_count,
    pwd_count: b.pwd_count,
    child_count: b.child_count,
    local_count: b.local_count,
    total_amount: b.total_amount,
    amount_due: b.amount_due,
    // Fixed values: the database refuses anything else from a guest
    source: 'online',
    payment_status: 'pending',
    attendance_status: 'upcoming',
    amount_paid: 0,
    capacity_override: false,
    hold_expires_at: new Date(Date.now() + FIFTEEN_MINUTES).toISOString(),
    ...(SEND_CONSENT ? { consent_given_at: b.consent_given_at } : {}),
  }
  const { error } = await supabase.from('bookings').insert(row)
  if (error) throw error
  return row
}
