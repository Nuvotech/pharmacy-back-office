# Code Standards

## General

- Business rules live in one place: the services in `apps/server/app/Domain` on the server and
  `packages/sales-core` on the devices. Controllers, React pages and mobile screens call them and never
  re-implement stock, price, currency or FEFO logic.
- Keep classes and modules small and single-purpose: one service per business action
  (`ReceiveDelivery`, `RecordAdjustment`, `IngestSyncBatch`), one screen per file.
- Fix root causes; do not layer workarounds. A stock figure that is wrong is fixed in the ledger logic, never
  patched in a page.
- Do not mix concerns: a controller does not build PDFs, a screen does not run SQL, a model does not hold
  business rules.
- Every stock change goes through the stock ledger. Nothing else writes `batches.qty_on_hand`.
- Quantities are integers in the smallest unit (tablet, capsule, ampoule). Convert to boxes only for display
  and input, using the shared pack helpers.
- Money is never handled as a float. Server: `DECIMAL` columns and `brick/money` (or bcmath). TypeScript:
  integer minor units (cents for USD, whole francs for CDF) through `sales-core/money`.
- Code, identifiers and comments are in English. Everything the user reads is in French and comes from
  translation files (`lang/fr` on the server, `packages/sales-core/src/i18n/fr.ts` for both mobile apps), not hard-coded in components.
- Times are stored in UTC on the server and shown in the shop's time zone. Device timestamps are sent with
  their UTC offset.

## PHP and Laravel

- PHP 8.3 with `declare(strict_types=1);` in every file. Typed parameters, return types and properties
  everywhere.
- Laravel Pint (PSR-12 preset) for formatting and Larastan at level 6 or higher; both run in CI and must pass.
- Controllers are thin: a Form Request validates the input, a `Domain` service does the work, then the
  controller returns `Inertia::render(...)` or an API Resource.
- Domain services are plain classes resolved from the container with one public method (`handle`). Any
  action that writes more than one row runs inside `DB::transaction()`.
- Lock the rows you are about to change (`lockForUpdate()`) when allocating or reallocating lots, so two
  requests cannot oversell the same lot.
- Models hold relationships, casts and query scopes only.
- Database enums are mirrored by PHP backed enums (`Role`, `MovementType`, `PaymentMethod`, `SellMode`);
  never compare against raw strings.
- Work longer than a request (imports, report exports, backups, alert recalculation) runs as a queued job.
  Jobs are idempotent: running one twice gives the same result.
- `env()` is only called inside `config/` files.

## Inertia and React (back office)

- One page component per screen in `resources/js/Pages`. Page data arrives as props from the controller; do
  not fetch page data from the browser.
- Mutations use Inertia forms (`useForm`) posting to back-office routes; validation errors come back from the
  Form Request and are shown beside the field.
- Shared data (signed-in user, today's exchange rate, alert counts, settings) is set once in
  `HandleInertiaRequests` and nowhere else.
- Props are typed. Generate the TypeScript types from the PHP Resources and enums
  (`spatie/laravel-typescript-transformer`) into `resources/js/types`; do not hand-write duplicates.
- Pages display what the server computed. A page never calculates stock, values, FEFO order or alert status.
- Build URLs with Ziggy's `route()` helper, never hard-coded paths.
- No client state library (no Redux, Zustand or React Query) in the back office. Use Inertia props, shared
  data and `useForm`; keep anything else in component state.
- List filters, sorting, search and page number live in the URL query string, read by the controller, so
  they survive a refresh and can be shared as a link.

## TypeScript (back office, mobile apps, packages)

- `strict: true` and `noUncheckedIndexedAccess: true` in every `tsconfig`.
- No `any`. Use explicit interfaces, or `unknown` narrowed before use.
- Validate data at the boundaries before trusting it: every API response in the mobile apps and every
  imported file is parsed with zod.
- API request and response types come from `packages/api-types`; never redeclare them in an app.
- One shared ESLint and Prettier config for all TypeScript code; lint errors fail CI.

## React Native and Expo (counter and manager apps)

- All selling logic (cart totals, pack/unit conversion, FEFO allocation, currency conversion, change, receipt
  numbers) lives in `packages/sales-core`. Screens call it.
- Screens never run SQL. SQLite is reached only through the repositories in `sales-core/db`.
- A sale is written in one `withTransactionAsync` call: sale, items, lot deductions and outbox event together.
- No network call anywhere in the sale path. Sync runs only in the `sales-core/sync` background loop.
- Device-created records get their UUID from `expo-crypto`'s `randomUUID()`, never from a counter or a
  timestamp.
- Before allowing a sale, check the device clock against the last server time; block selling with a clear
  message if it is clearly wrong.
- Design for the real devices: the counter app in landscape at 1180 × 820, the manager app in portrait at
  390 px wide. Touch targets are at least 44 px.

### Client state (mobile apps)

- Zustand for screen state shared across screens, one small store per concern: `cart`, `session`, `sync`.
  The `cart` and `sync` stores live in `packages/sales-core` so both apps use the same ones; `session` lives
  in each app. Never use Redux.
- Stores hold state and call `sales-core` functions; they do not contain business rules. Cart totals, FEFO
  allocation, pack/unit conversion and currency maths are pure functions in `sales-core`, tested on their own.
- Stores never copy data that lives in SQLite (medicines, lots, today's sales). Screens read it through the
  `sales-core` repositories.
- Anything that must survive a restart goes to SQLite, not a store: completed sales, the outbox and held
  sales (`held_sales` table). The cart being built is the only state that may be lost on a power cut.
- Components subscribe to the slice they need with a selector (`useCart((s) => s.total)`), never the whole
  store, so one change does not re-render every screen.
- Manager app: every API read goes through TanStack Query, with query keys from one `queryKeys` module and
  the cache persisted to the device. Writes are mutations that send an `Idempotency-Key` and invalidate the
  affected queries; never update cached server data by hand.
- Local, single-screen state (an open dialog, a keypad value) stays in `useState`.

## Styling

- `design.md` is the single source for styling: colours, typography, spacing, radii, status colours and
  component patterns. When code and `design.md` disagree, `design.md` wins; change it there first.
- Its tokens are implemented once per platform: the Tailwind theme in the back office and `tokens.ts` in the
  mobile apps. Components use those tokens only; no hard-coded hex values, font names or pixel radii.
- Follow the type, spacing and border-radius scales defined in `design.md`.
- Use status colours only with the meaning `design.md` gives them, and always pair a colour with a text
  label; colour alone is never the only signal.
- Amounts are shown through one shared formatter, in the format `design.md` specifies.

## API Routes (device API, `routes/api.php`)

### Design

- Every device route is versioned under `/api/v1/` (a `Route::prefix('v1')` group, controllers in
  `Controllers/Api/V1`). A breaking change to a request or response shape goes into `/api/v2/`; `v1` keeps
  working until every installed app has moved off it. Adding an optional field is not a breaking change.
- When a version is being retired, its responses carry `Deprecation` and `Sunset` headers, and the apps log
  a warning when they see them.
- Paths use plural nouns in kebab-case (`/api/v1/medicines/{id}`, `/api/v1/stock-adjustments`); actions that
  are not resources use a verb under their area (`/api/v1/sync/push`).
- Methods mean what they say: `GET` never changes data; `POST` creates or runs an action; `PATCH` changes part of
  a record; `DELETE` is not exposed for business records (they are deactivated instead).
- Status codes are used precisely: `200` read or update, `201` created (with the new resource), `204` nothing
  to return, `401` no or bad token, `403` not allowed, `404` not found, `409` conflict, `422` invalid input,
  `426` app too old, `429` rate limited, `503` maintenance.
- JSON fields are `snake_case`, matching the database and Laravel Resources; the TypeScript types in
  `packages/api-types` use the same names.
- Dates and times are ISO 8601 in UTC with the `Z` suffix (`2026-10-27T10:15:00Z`); dates without a time are
  `YYYY-MM-DD`.
- Money is never a JSON number. Amounts are decimal strings with their currency beside them
  (`{ "amount": "7500.00", "currency": "CDF" }`); quantities are integers in units.
- Responses use API Resources and the same shapes everywhere: `{ "data": ..., "meta": ... }` on success.
- Every error, not only validation, has the same shape: `{ "message": "...", "code": "LOT_EXPIRED",
  "errors": { ... } }`. `message` is French and safe to show the user; `code` is a stable machine-readable
  constant the apps branch on; `errors` holds per-field messages for `422`.
- Lists are paginated with a cursor and a maximum page size (100 by default, 500 for sync pulls); a request
  above the maximum gets the maximum, not an error.
- `GET /api/v1/sync/pull` pages with an opaque cursor; never return the whole catalogue in one response after
  the first full download.
- `GET /api/v1/health` needs no token and returns `{ "status": "ok", "server_time": ... }`. The apps use it to
  decide whether they are online and to check their clock.

### Security

- Every route except `health` and `device/register` uses `auth:sanctum` and checks the token's ability
  (`sync:counter`, `manager`); every mutation is also checked by a Policy.
- Validate and parse request input with a Form Request before any logic runs, and pass only
  `$request->validated()` onward; never `$request->all()` into a model.
- HTTPS only. Nginx redirects HTTP to HTTPS and sends `Strict-Transport-Security`.
- Rate limits with Laravel's `RateLimiter`, per token for authenticated routes and per IP otherwise: 60 requests
  a minute by default, 5 a minute for `device/register` and login. Exceeding them returns `429` with
  `Retry-After`.
- Request size is capped: a sync push carries at most 200 events and 1 MB; larger batches are split by the
  client.
- The device API sends no CORS headers: it serves native apps, not browsers.
- `APP_DEBUG=false` in production. Error responses never contain stack traces, SQL or file paths.
- Device tokens are stored in `expo-secure-store`, never in SQLite or plain storage. Tokens are revocable from
  the back office, and `last_used_at` is shown so unused devices can be spotted.
- PINs, passwords, tokens and full request bodies are never written to logs.

### Reliability

- `POST /api/v1/sync/push` is idempotent: it returns one result per event (`applied`, `duplicate` or `failed`
  with a reason) plus the corrected lot quantities, and never applies an event id twice.
- Every other mutating request from the apps carries an `Idempotency-Key` header (a UUID created once per user
  action). The server stores the response for 24 hours and returns it unchanged if the same key arrives again,
  so a retry after a dropped connection never changes a price or adjusts stock twice.
- Edits to existing records (price changes, adjustments from the manager app) send the record's `updated_at`.
  If the record changed since, the server returns `409` with code `STALE_RECORD` and the current record,
  instead of silently overwriting someone else's change.
- Clients retry only idempotent requests, with exponential backoff and jitter (1 s, 2 s, 4 s, up to 60 s), and
  honour `Retry-After` on `429` and `503`. Request timeout is 30 s.
- Nginx compresses JSON responses (gzip), since devices often sync over a weak mobile connection.
- The mobile apps send their version in an `X-App-Version` header; the server answers `426 Upgrade Required`
  to versions it no longer supports, since the apps are installed by APK and update unevenly.

### Operations

- Every request gets an `X-Request-Id` (the client's, or a new one), returned in the response and written to
  every log line for that request, together with the device id and user id.
- The API is documented as an OpenAPI spec generated from the code (Scribe), committed in `docs/api/`, and
  updated in the same change as the endpoint.
- Each endpoint has Pest feature tests for its success case, validation failure, missing token, wrong ability
  and, where it applies, duplicate request and stale record.

## Data and Storage

- Schema changes happen only through new migrations. A migration that has run in production is never edited.
- Anything created on a device has a UUID primary key. Auto-increment ids are only for server-only tables
  (users, exchange rates, inventory count lines).
- `stock_movements` is append-only: no updates, no deletes. Corrections are new movements.
- Money columns are `DECIMAL`, quantities `INT` in units. Sales store the unit price, currency paid and
  exchange rate in force at the time of sale.
- Medicines, suppliers and users referenced by history are deactivated (`is_active = 0`), never deleted.
- Index every column used for FEFO lookups, alerts and sync cursors (`updated_at`).
- Files live on disk or in Spaces, with only their path in the database: imported stock files, report exports,
  backups and product photos. Photos are resized to at most 400 px WebP before storage so devices can
  download them over a weak connection.

## Testing

- Every `Domain` service has Pest feature tests. The stock ledger, FEFO allocation and sync ingest (including a
  duplicate push and a lot shortfall) are tested before anything else.
- `packages/sales-core` has unit tests for FEFO, pack/unit conversion, currency rounding and the outbox.
- The offline test checklist in the Phase 2 plan is run on the real counter tablet before each release; a
  failing item blocks the release.

## File Organization

- `apps/server/app/Domain/` — business services, grouped by area: `Catalogue`, `Stock`, `Sales`, `Sync`,
  `Reports`
- `apps/server/app/Http/Controllers/BackOffice/` — Inertia controllers for the back-office screens
- `apps/server/app/Http/Controllers/Api/V1/` — device API controllers for `/api/v1` (registration, sync,
  manager actions)
- `apps/server/app/Http/Requests/`, `Resources/`, `Policies/` — validation, response shapes, authorization
- `apps/server/app/Enums/` — PHP enums mirroring database enums
- `apps/server/app/Jobs/` — queued work: imports, exports, backups, alert recalculation
- `apps/server/resources/js/Pages/` — one Inertia page per screen; `Components/` for shared UI; `types/`
  for generated types
- `apps/server/lang/fr/` — French interface text for the back office
- `apps/counter/app/` — counter app screens (Expo Router); `components/` for its UI pieces; `stores/` for
  its `session` store
- `apps/manager/app/` — manager app screens (Expo Router); `components/` for its UI pieces; `stores/` for its
  `session` store; `queries/` for TanStack Query hooks and the `queryKeys` module
- `packages/sales-core/src/` — `db/` (schema, migrations, repositories), `cart/` (pure cart functions),
  `fefo/`, `money/`, `sync/`, `stores/` (shared `cart` and `sync` stores), `i18n/`
- `packages/api-types/src/` — request and response types for the device API
- `docs/api/` — generated OpenAPI spec for the device API
