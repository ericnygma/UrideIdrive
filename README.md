# STEWARD

A private chauffeur scheduling PWA for car owners who manage their own drivers. Not a rideshare platform — a personal dispatch tool: book rides for household members, track the fleet, and give a driver a clean trip sheet to operate from.

---

## UX Design Rationale

### Aesthetic Direction: Luxury Editorial

The app serves a user who owns a vehicle and employs or contracts a driver. The interaction model is closer to a private concierge than a consumer app. The design direction reflects that: dark, ink-on-black, gold accents, unhurried typography — referencing the visual language of high-end hospitality rather than tech startups.

The single word that guided every decision: **restraint**. Nothing decorative that doesn't earn its place.

### Typography

Three fonts, three roles — never mixed within a role:

| Font | Role | Rationale |
| --- | --- | --- |
| Cormorant SC (small caps, wt 300) | Wordmarks, drawer nav indices | Maximum gravitas with minimum weight. The tight tracking reads as a monogram, not a label. |
| Cormorant Garamond (wt 300, italic 300) | Body text, form inputs, trip data | Old-style figures and true italics give data a handwritten quality — appropriate for a scheduling document. |
| Inter (wt 300–500) | Labels, buttons, metadata | The utilitarian counterpoint. Used only where legibility over aesthetics is the priority. |

Font sizes are floored at `0.65rem` across the app. Below that threshold, letter-spacing compounds the illegibility problem on small screens — no label is worth eye strain.

### Color System

```css
--bg:      #0E0D0B   /* deep near-black, warm undertone */
--surface: #15130E   /* card / modal layer */
--faint:   #2C2820   /* hairlines, dividers, input underlines */
--muted:   #9E9590   /* secondary text, metadata (lifted from #6B6358 for accessibility) */
--ink:     #EDE8DF   /* primary text, warm off-white */
--gold:    #B8923A   /* brand accent — used sparingly for structural moments */
--gold-lt: #D4AE62   /* labels, interactive gold — lighter to read at small sizes */
```

Gold is used structurally, not decoratively. It marks: the rule under the wordmark, the focus state on inputs, the primary action button border, trip status badges. It is never used as a fill for text-heavy elements.

### Motion

All animations are GPU-safe: only `opacity` and `transform` in keyframes. `background-position`, `border-color`, and `box-shadow` in keyframes trigger Paint — avoided throughout.

The page-load sequence is staggered `riseIn` (`translateY(14px) → 0, opacity 0 → 1`). One well-orchestrated entrance per page creates more perceived quality than scattered micro-interactions.

The skeleton loader uses a `::after` shimmer with `transform: translateX(-100% → 250%)` and `will-change: transform`, promoting it to its own compositing layer.

### Accessibility

- Muted text (`--muted`) was lifted from `#6B6358` to `#9E9590` — the original value failed WCAG AA contrast on the dark background.
- Font sizes floored to `0.65rem` universally.
- Letter-spacing reduced on UI text (labels, buttons): long tracking at small sizes degrades legibility. Decorative display text (wordmarks, taglines) preserves its wide tracking.
- Gold labels use `--gold-lt` (`#D4AE62`) not `--gold` (`#B8923A`) — the lighter value passes contrast at `0.65rem`.

### Interaction Patterns

**Side drawer** (hamburger, slides from right): replaces a nav-links row in the header. Rationale — on mobile, a nav row competes with the wordmark and collapses poorly. The drawer keeps the header clean and scales to any number of destinations. Two staggered bars animate to an X on open.

**Inline confirmations**: vehicle delete shows an inline yes/no row inside the card rather than a browser `confirm()` dialog. The dialog breaks the visual context and looks wrong inside a PWA. The inline row maintains the aesthetic.

**Filter-aware empty states**: the empty state message changes based on the active filter (upcoming / past / all). "Nothing upcoming" reads differently than "no trips ever" — the distinction matters for a scheduling tool.

**Scroll + filter persistence**: `sessionStorage` saves the active filter and scroll position when leaving the trips list. Returning from a trip detail restores both. Navigating away and back is a common workflow; losing your place is friction.

**Duplicate trip shortcut**: a "Duplicate" link on the trip detail header pre-fills the booking form via `?copy=<tripId>`. Repeat bookings (same client, same route, different date) are the dominant use case.

**Mark complete / Restore**: trips have three states — active, cancelled, completed. The actions row adapts: active shows "Mark Complete" + "Cancel"; cancelled shows "Restore Trip" only; completed hides the row. Completed trips are visually distinguished with a muted badge.

**Toast notifications**: vehicle add/edit confirms with a 2.5s toast at top-center rather than an alert. Non-blocking, visually consistent with the aesthetic.

---

## Technical Decisions

### No Framework

Vanilla HTML/CSS/JS. Rationale: the visual language requires precise control over every animation, transition, and DOM state. A component framework imposes rendering abstractions that make fine-grained GPU-safe animation harder to reason about, not easier. The app is 5 pages. The added complexity of a build pipeline is not justified.

### Firebase SDK v8 Compat Mode

`firebase-app.js`, `firebase-auth.js`, `firebase-firestore.js` loaded from CDN. The compat API exposes `auth` and `db` as globals via `firebase-config.js`, which every page imports. Rationale: simpler than ES module imports for a no-bundler project; avoids `import()` dynamic loading complexity in service worker scope.

### Authentication Pattern

Every authenticated page calls `requireAuth()` on load — an `onAuthStateChanged` listener that redirects to `login.html` if no user is found. An 8-second timeout failsafe redirects even if Firebase never resolves (offline, misconfigured). The login page redirects away if a user is already signed in.

### Service Worker Strategy

```text
Navigation requests  → network-first, cache on success, fallback to cache
Static assets        → cache-first, network on miss, cache response
Firebase API calls   → bypassed entirely (SDK handles its own caching/retry)
sw.js itself         → served with no-cache headers (firebase.json) so updates propagate immediately
```

The app shell (5 HTML files + manifest + firebase-config.js + icons) is precached on install. Stale cache versions are deleted on activate with `clients.claim()` so the new worker takes control immediately.

### Async Coordination: `vehiclesReady` Promise

`book-ride.html` loads vehicles from Firestore asynchronously. When a trip is duplicated (`?copy=<tripId>`), the pre-fill logic needs to select the matching vehicle radio — but the radios don't exist until `loadVehicles()` renders them. A `vehiclesReady` Promise (resolved inside `loadVehicles()`) gates the pre-fill so it always runs after the vehicle list is ready, regardless of network timing.

### GPU-Safe Animations

Every keyframe animation uses only `opacity` and `transform`. The shimmer skeleton uses `transform: translateX()` on a `::after` pseudo-element with `will-change: transform` — this promotes the element to its own compositing layer and keeps the animation entirely on the GPU. `background-position` animation (a common shimmer technique) was explicitly avoided because it triggers Paint on every frame.

### Safe Area Insets

The PWA runs with `apple-mobile-web-app-status-bar-style: black-translucent`, which means the viewport extends under the status bar. Every page header uses `padding-top: calc(1rem + env(safe-area-inset-top, 0px))` to clear the notch/Dynamic Island. FABs (index, trips) use `bottom: calc(1.75rem + env(safe-area-inset-bottom, 0px))` to clear the iPhone home indicator and Android gesture bar.

---

## App Structure

```text
localDriver/             ← Firebase Hosting root
  login.html             Auth screen — entry point for unauthenticated users
  index.html             Home dashboard — upcoming trip, fleet summary, book FAB
  book-ride.html         Booking form — type, pickup, drop-off, date/time, vehicle, notes
  trips.html             Trip list — filter (upcoming/past/all), skeleton, scroll persistence
  trip-detail.html       Trip sheet — full details, mark complete, cancel, restore, duplicate
  firebase-config.js     Firebase init — exports auth + db globals
  manifest.json          PWA manifest — icons, display: standalone, theme color
  sw.js                  Service worker — app shell precache, network/cache strategies
  icons/
    icon-192.png
    icon-512.png
    icon-maskable.png    Full-bleed for Android adaptive icons
    apple-touch-icon.png 180px for iOS home screen

_legacy/                 Pre-STEWARD files — old Vuetify/Roboto stack, not deployed
firebase.json            Firebase Hosting config — public dir, cache headers
generate-icons.js        Build script — generates PNGs from pure Node.js (zero dependencies)
```

### Navigation Flow

```text
login.html
  └─▶ index.html
        ├─▶ book-ride.html ◀─────────────────────── (duplicate from trip-detail)
        ├─▶ trips.html
        │     └─▶ trip-detail.html
        │           ├─▶ trips.html (back)
        │           └─▶ book-ride.html?copy=<id>
        └─▶ [drawer] My Trips → trips.html
                     Sign Out → login.html
```

---

## Data Model (Firestore)

All data is scoped to the authenticated user (`users/{uid}/`).

### `users/{uid}/trips/{tripId}`

```text
type          string    'transfer' | 'hourly' | 'full-day'
pickup        string
dropoff       string
date          string    YYYY-MM-DD
time          string    HH:MM
vehicleId     string    ref to vehicles collection
notes         string?
flightNumber  string?
status        string    'active' | 'cancelled' | 'completed'
createdAt     timestamp
```

### `users/{uid}/vehicles/{vehicleId}`

```text
make          string
model         string
year          string
plate         string
color         string?
```

---

## PWA Installation

**iOS (Safari):** Share → Add to Home Screen. Launches full-screen with black-translucent status bar.

**Android (Chrome):** Browser shows "Add to Home Screen" banner automatically after the installability criteria are met (HTTPS + manifest + registered service worker). Tap to install; uses the maskable icon for the adaptive icon system.

**Deployment:** `firebase deploy` from project root. Requires `firebase-tools` and an authenticated Firebase CLI session.

---

## Icon Generation

Icons are generated by `generate-icons.js` (project root) — a zero-dependency Node.js script that encodes PNG files directly using CRC32 + zlib deflate. No canvas, no sharp, no jimp. The icon is a dark circle with a gold double-ring and a pixel-grid "S" glyph rendered via anti-aliased circle fills.

Run: `node generate-icons.js` from the project root. Output goes to `localDriver/icons/`.
