import Counter from './Counter'
import { isCamping, isRock, discountedCount, TENTS } from '../lib/pricing'

export const AGE_GROUPS = ['0–7', '8–17', '18–24', '25–34', '35–44', '45–59', '60+']
// Answers from Goatcliff's customer survey (Oct 2026), plus Other. Keys are the database values.
export const FOUND_US = { tiktok: 'TikTok', facebook: 'Facebook', friends_family: 'Friends or family', google: 'Google', other: 'Other' }
// One ID photo per discounted person. The key is also the file name in storage (senior-1.jpg).
const ID_KINDS = [['senior', 'seniors', 'Senior citizen IDs'], ['pwd', 'pwd', 'PWD IDs'], ['local', 'locals', 'Atok local IDs']]
const MAX_PHOTO = 5 * 1024 * 1024
// The id-photos storage only accepts these (iPhone HEIC photos would be refused)
const PHOTO_TYPES = 'image/jpeg,image/png,image/webp'

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
  // Added after the Oct 25 interview (FR-15, FR-20, FR-29, FR-33)
  idPhotos: { senior: [], pwd: [], local: [] }, // the chosen photo files, one per discounted person
  ages: Object.fromEntries(AGE_GROUPS.map((g) => [g, 0])),
  sexes: { male: 0, female: 0 },
  province: '',
  foundUs: '',
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
  for (const [kind, field, label] of ID_KINDS) {
    const files = form.idPhotos[kind] || []
    if (files.length !== form[field]) errors.idPhotos = `${label}: choose ${form[field]} photo${form[field] === 1 ? '' : 's'}, one per person.`
    else if (files.some((f) => f.size > MAX_PHOTO)) errors.idPhotos = 'Each ID photo must be 5 MB or smaller.'
    else if (files.some((f) => !PHOTO_TYPES.split(',').includes(f.type))) errors.idPhotos = 'ID photos must be JPG, PNG or WebP. On an iPhone, take a screenshot of the photo and upload that.'
    if (errors.idPhotos) break
  }
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
        <select value={form.foundUs} onChange={setText('foundUs')}>
          <option value="">Choose…</option>
          {Object.entries(FOUND_US).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
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
      {needsId && ID_KINDS.filter(([, field]) => form[field] > 0).map(([kind, field, label]) => (
        <label key={kind}>
          {label} <span className="hint">({form[field]} photo{form[field] > 1 ? 's' : ''}, one per person)</span>
          <input type="file" accept={PHOTO_TYPES} multiple={form[field] > 1}
            onChange={(e) => setIn('idPhotos', kind)(Array.from(e.target.files || []))} />
          {form.idPhotos[kind]?.length > 0 && <span className="hint">{form.idPhotos[kind].length} chosen</span>}
        </label>
      ))}
      {errors.idPhotos && <span className="field-error">{errors.idPhotos}</span>}

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

