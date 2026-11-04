# Goatcliff Guest Site (frontend)

The guest side of the Goatcliff reservation system: browse activities, book camping or the
Rock Activities Package, pay the down payment by GCash, and check a booking's status.
React + Vite, connected to Supabase. No login needed to book.

## Run it in VS Code

Needs Node.js 20.19 or newer.

1. Open this folder in VS Code (File -> Open Folder).
2. Open `.env` and put your Supabase Project URL in `VITE_SUPABASE_URL`.
3. Open the terminal (Terminal -> New Terminal) and run:
   - `npm install` (first time only)
   - `npm run dev`
4. Ctrl + click the http://localhost:5173 link.

## What is real and what is fake (for now)

All backend calls are in `src/lib/api.js`.

| Function | Status |
|---|---|
| getActivities, getActivity | REAL: reads the activities table (needs backend file 12) |
| getAvailability | MOCK: fake calendar data until the availability function exists |
| createBooking | MOCK: fake reference number until the booking function exists |
| submitPaymentReference | MOCK: until the backend has the for_verification status |
| lookupBooking | MOCK: until the lookup function exists |

When each backend function is ready, replace only that function in `api.js`.
Price previews are in `src/lib/pricing.js`; the official price always comes from the server.

## Folder guide

| Path | What it is |
|---|---|
| `src/App.jsx` | The list of pages and their addresses |
| `src/pages/Home.jsx` | Browse page: camping areas grouped by area, rock package |
| `src/pages/ActivityDetail.jsx` | One activity's prices and rules |
| `src/pages/Book.jsx` | Booking flow: Date -> Details -> Review -> Payment -> Done |
| `src/pages/Status.jsx` | Check my booking (reference number + email) |
| `src/components/Calendar.jsx` | Month calendar with Open / Busy / Very busy / Full / Too soon |
| `src/components/GuestForm.jsx` | Guest details, discounts, age checkbox, privacy consent + validation |
| `src/components/PaymentStep.jsx` | GCash instructions, 15-minute timer, reference number |
| `src/components/Confirmation.jsx` | Reference number + "Add a rock activity?" |
| `src/lib/` | Supabase connection, backend calls, prices, dates, error messages |
| `src/index.css` | All styles (mobile-first) |

## To fill in

- `src/components/PaymentStep.jsx`: Goatcliff's real GCash name and number.
- Check that `activities.type` is `'camping'` for camping areas (see `isCamping` in `src/lib/pricing.js`).

## Hosting on Vercel

1. On vercel.com, **Add New → Project → Import** this GitHub repository.
2. Vercel detects Vite. Keep the defaults (build `npm run build`, output `dist`) and click **Deploy**.
   Until step 3 the site shows a "not connected yet" page.
3. **Settings → Environment Variables**, add both, then **Deployments → ⋯ → Redeploy**:
   - `VITE_SUPABASE_URL` (Supabase: Project Settings → API → Project URL)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (the publishable / anon key; never the secret or service_role key)
4. Every push to `main` deploys again by itself.

Point both sites at **goatcliff-dev** first and test there. Switch the two values to prod only after the prod
database has the same changes (see the backend repo's release steps).

Page links look like `…/#/bookings`. The `#` lets every page open on any host without extra settings.

## Design

Same look as the admin site ("topographic trail map"). The home page map is Goatcliff's aerial photo; the clickable boxes are in `src/components/AerialMap.jsx`. Fonts are in
`src/assets/fonts/` (SIL Open Font License).
