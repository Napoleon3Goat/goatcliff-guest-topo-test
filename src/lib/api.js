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
    discount_amount: b.discount_amount,
    // Fixed values: the database refuses anything else from a guest
    source: 'online',
    payment_status: 'pending',
    attendance_status: 'upcoming',
    amount_paid: 0,
    capacity_override: false,
    // No hold_expires_at: the database starts the 5-minute payment timer itself.
    consent_given_at: b.consent_given_at,
  }
  const { error } = await supabase.from('bookings').insert(row)
  if (error) throw error
  // My own copy of when the 5 minutes end, just for the countdown on screen.
  // (The database keeps the real timer and refuses proof that comes too late.)
  const payBefore = Date.now() + 5 * 60 * 1000
  // ID photos for the discounts go to the private id-photos bucket, named after the booking
  // (GC-XXXXXXXX/senior-1.jpg). Only Super Admin and Staff Admin can open them.
  const failedPhotos = await uploadIdPhotos(row.reference_number, idPhotos)
  return { ...row, failedPhotos, payBefore }
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

// ---------- Goat Cliff's GCash / Maya details ----------
// The Super Admin sets these on the admin site (name, number, QR image, on/off).
// Guests only get the ones that are on.
export async function getWallets() {
  const { data, error } = await supabase.from('payment_wallets')
    .select('id, name, account_name, account_number, qr_path').order('id')
  if (error) throw error
  return data.map((w) => ({
    ...w,
    // the QR image's web address (the payment-qr storage is public), or null if none yet
    qrUrl: w.qr_path ? supabase.storage.from('payment-qr').getPublicUrl(w.qr_path).data.publicUrl : null,
  }))
}

// ---------- Payment proof ----------
// The guest sends the reference number + a screenshot of their GCash / Maya receipt.
// 1. upload the screenshot to the private payment-receipts storage (GC-XXXXXXXX/receipt-....jpg)
// 2. submit_payment saves it as a payment for staff to check, and stops the 5-minute timer
export async function submitPayment(booking, { method, reference, receipt }) {
  const ext = (receipt.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${booking.reference_number}/receipt-${Date.now()}.${ext}`
  const upload = await supabase.storage.from('payment-receipts')
    .upload(path, receipt, { contentType: receipt.type || 'image/jpeg' })
  if (upload.error) throw new Error('RECEIPT_UPLOAD: ' + upload.error.message)

  const { error } = await supabase.rpc('submit_payment', {
    p_reference: booking.reference_number,
    p_email: booking.email,
    p_method: method,
    p_transaction_reference: reference.trim(),
    p_receipt_path: path,
  })
  if (error) throw error
}

// Check my booking: one booking, only when the reference AND the email match (lookup_booking).
// Returns null when nothing matches.
export async function lookupBooking(reference, email) {
  const { data, error } = await supabase.rpc('lookup_booking', { p_reference: reference, p_email: email.trim() })
  if (error) throw error
  return data?.[0] || null
}
