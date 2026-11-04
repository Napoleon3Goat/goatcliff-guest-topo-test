// EVERY call to the backend goes through this file.
// It follows claude/frontend-recommendations.md (what the database expects).
import { supabase } from './supabase'
import { addDays } from './dates'



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
// closed_dates() lists the days Goatcliff closed (no reasons, which only admins see).
// A changed daily limit isn't shown to guests; the database still refuses a full day with DAY_FULL.
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

  const closedRes = await supabase.rpc('closed_dates', { p_activity_id: activity.id, p_from: fromDate, p_to: toDate })
  if (closedRes.error) throw closedRes.error
  const closed = (closedRes.data || []).map((r) => r.closed_date)
  return { closed, taken: [...taken], counts, caps: {} }
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

// `b` already uses the database column names (Book.jsx builds it).
export async function createBooking(b, idPhotos = []) {
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
    province: b.province,
    found_us: b.found_us,
    emergency_contact_name: b.emergency_contact_name,
    emergency_contact_number: b.emergency_contact_number,
    age_0_7: b.age_0_7, age_8_17: b.age_8_17, age_18_24: b.age_18_24, age_25_34: b.age_25_34,
    age_35_44: b.age_35_44, age_45_59: b.age_45_59, age_60_up: b.age_60_up,
    male_count: b.male_count,
    female_count: b.female_count,
    tents_for_4: b.tents_for_4,
    tents_for_2: b.tents_for_2,
    total_amount: b.total_amount,
    amount_due: b.amount_due,
    // Fixed values: the database refuses anything else from a guest
    source: 'online',
    payment_status: 'pending',
    attendance_status: 'upcoming',
    amount_paid: 0,
    capacity_override: false,
    // No hold_expires_at: hold expiry is Capstone 2. Without it the database keeps counting an unpaid
    // booking toward the daily limit, the same way the calendar does, so a day can't be overbooked.
    consent_given_at: b.consent_given_at,
  }
  const { error } = await supabase.from('bookings').insert(row)
  if (error) throw error
  // ID photos for the discounts go to the private id-photos bucket, named after the booking
  // (GC-XXXXXXXX/senior-1.jpg). Only Super Admin and Staff Admin can open them.
  const failedPhotos = await uploadIdPhotos(row.reference_number, idPhotos)
  return { ...row, failedPhotos }
}

// idPhotos: [{ kind: 'senior' | 'pwd' | 'local', file }]. Returns how many could not be uploaded.
async function uploadIdPhotos(reference, idPhotos) {
  let failed = 0
  const counts = {}
  for (const { kind, file } of idPhotos) {
    counts[kind] = (counts[kind] || 0) + 1
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const { error } = await supabase.storage.from('id-photos')
      .upload(`${reference}/${kind}-${counts[kind]}.${ext}`, file, { contentType: file.type || 'image/jpeg' })
    if (error) failed += 1
  }
  return failed
}
