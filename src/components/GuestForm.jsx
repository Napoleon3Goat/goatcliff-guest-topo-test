import Counter from './Counter'
import { isCamping, isRock, isViewing, discountedCount, TENTS } from '../lib/pricing'

export const AGE_GROUPS = ['0–7', '8–17', '18–24', '25–34', '35–44', '45–59', '60+']
// Answers from Goatcliff's customer survey (Oct 2026), plus Other
export const FOUND_VIA = ['TikTok', 'Facebook', 'Friends or family', 'Google', 'Other']

export const EMPTY_FORM = {
  name: '',
  contact: '',
  email: '',
  companions: '',
  groupSize: 1,
  seniors: 0,
  pwd: 0,
  children: 0, // 7 and below (camping per-person fee; rock and viewing: watch only)
  locals: 0, // Atok locals
  viewers: 0, // rock only
  ageConfirmed: false, // rock only
  // Added after the Oct 25 interview (FR-15, FR-20, FR-33). The database has no columns for these yet,
  // so api.js does not send them; they are shown in the demo only.
  idPhotos: [], // file names of the ID photos for senior / PWD / Atok local discounts
  ages: Object.fromEntries(AGE_GROUPS.map((g) => [g, 0])),
  sexes: { male: 0, female: 0 },
  province: '',
  foundVia: '',
  emergencyName: '', // rock only
  emergencyContact: '', // rock only
  tents4: 0, // camping only
  tents2: 0, // camping only
  consent: false,
  consentAt: null, // when the guest ticked the box (saved as consent_given_at)
}

const sum = (obj) => Object.values(obj).reduce((t, n) => t + n, 0)
const mobile = (v) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''))

// Checks the form before anything is sent, so the database never has to reject it.
// Returns { fieldName: 'message' }; an empty object means everything is fine.
export function validate(activity, form) {
  const errors = {}
  const g = form.groupSize
  if (!form.name.trim()) errors.name = 'Please enter your name.'
  if (!mobile(form.contact)) errors.contact = 'Enter an 11-digit mobile number starting with 09.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email. Your reference number is sent here.'
  if (g < 1) errors.groupSize = 'At least 1 person.'
  if (discountedCount(form) > g) errors.discounts = 'One discount per person: the discount counts can\'t add up to more than the group.'
  if (form.seniors + form.pwd + form.locals > 0 && form.idPhotos.length === 0) errors.idPhotos = 'Upload a photo of the ID for each discount.'
  if (sum(form.ages) !== g) errors.ages = `The age groups must add up to ${g}.`
  if (form.sexes.male + form.sexes.female !== g) errors.sexes = `Male and female must add up to ${g}.`
  if (isRock(activity)) {
    if (form.viewers > g) errors.viewers = 'Viewers can\'t be more than the group.'
    if (form.children > form.viewers) errors.children = 'Children 7 and below can only join as viewers.'
    if (g - form.viewers > 0 && !form.ageConfirmed) errors.ageConfirmed = 'Please confirm everyone doing the package is old enough.'
    if (!form.emergencyName.trim()) errors.emergencyName = 'Enter an emergency contact person.'
    if (!mobile(form.emergencyContact)) errors.emergencyContact = 'Enter their 11-digit mobile number starting with 09.'
  }
  if (!form.consent) errors.consent = 'Please tick the box to agree.'
  return errors
}

export default function GuestForm({ activity, form, setForm, errors }) {
  const camping = isCamping(activity)
  const rock = isRock(activity)
  const set = (field) => (value) => setForm({ ...form, [field]: value })
  const setText = (field) => (e) => set(field)(e.target.value)
  const setIn = (field, key) => (value) => setForm({ ...form, [field]: { ...form[field], [key]: value } })
  const minAge = activity.min_age ?? 10
  const needsId = form.seniors + form.pwd + form.locals > 0

  return (
    <div className="form">
      <h2>Your details</h2>

      <label>
        Full name
        <input value={form.name} onChange={setText('name')} autoComplete="name" />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>

      <label>
        Mobile number
        <input value={form.contact} onChange={setText('contact')} inputMode="tel" placeholder="09XX XXX XXXX" autoComplete="tel" />
        {errors.contact && <span className="field-error">{errors.contact}</span>}
      </label>

      <label>
        Email
        <input type="email" value={form.email} onChange={setText('email')} autoComplete="email" />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>

      <label>
        Province <span className="hint">(optional)</span>
        <input value={form.province} onChange={setText('province')} autoComplete="address-level1" placeholder="e.g. Pangasinan" />
      </label>

      <label>
        How did you find Goatcliff? <span className="hint">(optional)</span>
        <select value={form.foundVia} onChange={setText('foundVia')}>
          <option value="">Choose…</option>
          {FOUND_VIA.map((f) => <option key={f}>{f}</option>)}
        </select>
      </label>

      <label>
        Companions' names <span className="hint">(optional, one per line)</span>
        <textarea rows={3} value={form.companions} onChange={setText('companions')} />
      </label>

      {rock && (
        <>
          <h2>Emergency contact</h2>
          <div className="form-pair">
            <label>
              Name
              <input value={form.emergencyName} onChange={setText('emergencyName')} />
              {errors.emergencyName && <span className="field-error">{errors.emergencyName}</span>}
            </label>
            <label>
              Mobile number
              <input value={form.emergencyContact} onChange={setText('emergencyContact')} inputMode="tel" placeholder="09XX XXX XXXX" />
              {errors.emergencyContact && <span className="field-error">{errors.emergencyContact}</span>}
            </label>
          </div>
        </>
      )}

      <h2>Your group</h2>
      <Counter label="Group size" hint="Everyone, including you" value={form.groupSize} onChange={set('groupSize')} min={1} />
      {rock && (
        <>
          <Counter label="Viewing only" hint="Going up to watch, not doing the activities" value={form.viewers} onChange={set('viewers')} />
          {errors.viewers && <span className="field-error">{errors.viewers}</span>}
        </>
      )}

      <h3>Discounts</h3>
      <Counter label="Senior citizens" value={form.seniors} onChange={set('seniors')} />
      <Counter label="PWDs" value={form.pwd} onChange={set('pwd')} />
      <Counter label="Atok locals" value={form.locals} onChange={set('locals')} />
      <Counter label="Children 7 and below" hint={rock ? 'Viewing only' : undefined} value={form.children} onChange={set('children')} />
      {errors.discounts && <span className="field-error">{errors.discounts}</span>}
      {errors.children && <span className="field-error">{errors.children}</span>}
      {needsId && (
        <label>
          ID photos for the senior, PWD and Atok local discounts
          <input type="file" accept="image/*" multiple
            onChange={(e) => set('idPhotos')(Array.from(e.target.files || []).map((f) => f.name))} />
          {form.idPhotos.length > 0 && <span className="hint">{form.idPhotos.length} photo{form.idPhotos.length > 1 ? 's' : ''} chosen</span>}
          {errors.idPhotos && <span className="field-error">{errors.idPhotos}</span>}
        </label>
      )}

      <h3>Ages</h3>
      <div className="counter-grid">
        {AGE_GROUPS.map((g) => <Counter key={g} label={g} value={form.ages[g]} onChange={setIn('ages', g)} />)}
      </div>
      {errors.ages && <span className="field-error">{errors.ages}</span>}

      <h3>Sex</h3>
      <div className="counter-grid">
        <Counter label="Male" value={form.sexes.male} onChange={setIn('sexes', 'male')} />
        <Counter label="Female" value={form.sexes.female} onChange={setIn('sexes', 'female')} />
      </div>
      {errors.sexes && <span className="field-error">{errors.sexes}</span>}

      {camping && (
        <>
          <h3>Tent rental <span className="hint">(optional, per stay, ground tarp included)</span></h3>
          {Object.entries(TENTS).map(([key, t]) => (
            <Counter key={key} label={`${t.label} · ₱${t.price}`} value={form[key]} onChange={set(key)} max={t.stock} />
          ))}
        </>
      )}

      {rock && form.groupSize - form.viewers > 0 && (
        <label className="check">
          <input type="checkbox" checked={form.ageConfirmed} onChange={(e) => set('ageConfirmed')(e.target.checked)} />
          <span>Everyone doing the package is {minAge} or older. Younger children are counted as viewers.</span>
        </label>
      )}
      {errors.ageConfirmed && <span className="field-error">{errors.ageConfirmed}</span>}

      <details className="terms">
        <summary>Read the Privacy Notice, Booking Terms and waiver</summary>
        <p className="terms-tbd">To be filled in by Goatcliff.</p>
      </details>
      <label className="check consent">
        <input type="checkbox" checked={form.consent}
          onChange={(e) => setForm({ ...form, consent: e.target.checked, consentAt: e.target.checked ? new Date().toISOString() : null })} />
        <span>I agree to the Privacy Notice, Booking Terms and waiver.</span>
      </label>
      {errors.consent && <span className="field-error">{errors.consent}</span>}
    </div>
  )
}

export { isViewing }
