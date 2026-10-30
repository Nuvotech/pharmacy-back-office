# Architecture Context

Offline-first pharmacy management system for a single shop working under unstable power and internet.
Four parts: a **counter tablet app** (sales only, works offline), a **back-office web app** (laptop and
back-room tablet, online only), a **manager mobile app**, and the **API + MySQL database**, which is the
single source of truth for stock.

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Server framework | Laravel 11 (PHP 8.3) | One app: business rules, stock ledger, FEFO, back-office pages, sync API for devices, imports, reports |
| Database | MySQL 8 | Source of truth: catalogue, lots, stock movements, sales, users, devices |
| Back-office UI | Inertia.js + React + TypeScript | Pharmacist screens on the laptop and back-room tablet, served by Laravel controllers; online only |
| Back-office styling | Tailwind CSS + shadcn/ui | Components themed with the design.md tokens (Poppins, slate canvas and sidebar, blue-600 accent, 4 px radius) in `resources/css/tokens.css`; French UI |
| Front-end build | Vite (Laravel plugin) | Builds the Inertia React pages at deploy time; no Node process in production |
| Counter app | React Native (Expo) + TypeScript | Cashier sales on the counter tablet; every sale works offline |
| Manager app | React Native (Expo) + TypeScript | Today, alerts, product sheet, price/stock changes, offline quick sale |
| Device storage | expo-sqlite (WAL mode, FTS5) | Local copy of catalogue, lots, prices and rate; unsynced sales and outbox |
| Shared mobile logic | `packages/sales-core` (TypeScript) | SQLite schema, FEFO allocation, price/currency maths, outbox and sync client |
| Client state (mobile) | Zustand | Cart in progress, signed-in cashier, sync status; screen state only, never a copy of stored data |
| Server data (manager app) | TanStack Query, cache persisted on the device | Today, alerts, product sheet; caching, retries, refresh, last data readable offline |
| Auth | Laravel session auth + Sanctum | Session login for the Inertia back office; one Sanctum token per device for the mobile apps |
| Background work | Laravel queue (database driver) + scheduler | Imports, report exports, alert recalculation, backups |
| Import / export | Laravel Excel; DomPDF | Opening-stock import, Excel and PDF reports |
| Printing | Bluetooth ESC/POS from the counter app | On-demand receipts (Phase 3) |
| Hosting | DigitalOcean droplet: Nginx, PHP-FPM, MySQL, Certbot | One Laravel app serves the back office and the device API |
| Mobile builds | EAS Build → APK | Installed directly on the shop's devices; no app store needed |

## System Boundaries

- `apps/server` — the Laravel application. The only code that reads or writes MySQL.
  - `app/Domain` — every business rule as services: stock ledger, FEFO allocation, receptions, returns,
    adjustments, inventory, exchange rates, sync ingest. Controllers call these; nothing else changes stock.
  - `app/Http/Controllers/BackOffice` — Inertia controllers for the pharmacist's screens; they validate input,
    call `app/Domain` and return Inertia responses.
  - `app/Http/Controllers/Api` — JSON endpoints for the mobile apps: device registration, sync pull and push,
    manager actions.
  - `resources/js` — the Inertia React pages and components: dashboard, medicines, opening-stock import,
    receptions, stock, returns, adjustments, inventory, reports, device and user management. Display and
    forms only; no business rules.
  - `database/migrations` — the schema already delivered (16 tables, 2 views).
- `apps/counter` — Expo counter app. Owns the cashier screens: PIN login, search, cart, box/unit selling,
  payment (FC/USD, M-Pesa, Orange Money, Airtel Money), prescriber capture, hold sale, receipt printing,
  today's sales. Never changes prices, stock or medicines.
- `apps/manager` — Expo manager app. Owns Today (sales, pending sync, device status, top sellers), alerts,
  product sheet, supplier-order list, and the offline quick sale. Price and stock changes go through the
  server API and need a connection.
- `packages/sales-core` — shared by both mobile apps. Owns the device SQLite schema and migrations, FEFO lot
  allocation, pack/unit conversion, currency maths, receipt numbering, the outbox and the sync client, plus
  the shared `cart` and `sync` stores.
- `packages/api-types` — TypeScript types for the device API's requests and responses, shared by both
  mobile apps.

## Storage Model

- **MySQL (server)**: all business data. `stock_movements` is the append-only history of every stock
  change; `batches.qty_on_hand` is a cached total of those movements. `sync_events` logs every event received
  from a device, by its UUID. Views `v_medicine_stock` and `v_batch_expiry` feed alerts and the dashboard.
  Categories are a `categories` table linked to medicines through `category_medicine` (a medicine can be in
  several); a medicine's photo is `medicines.image_path` on the public disk. Prices are in CDF
  (`settings.base_currency`). A reception is a `draft` until validated: its `reception_lines` keep the
  invoice as typed (packs, cost per pack in the invoice currency, USD or CDF); validation creates one lot
  per line with `purchase_price_unit` in CDF (USD converted at the rate in force on the reception date,
  stored on the reception) and records it through the stock ledger (`App\Domain\Stock\RecordStockMovement`).
- **SQLite (each mobile device)**: a copy of medicines, lots with quantities, cashiers' PIN hashes, settings
  and the day's rate, overwritten by each pull; plus the sales made on that device, held (paused) sales, and
  the outbox of events not yet accepted by the server. Unsynced sales and held sales are the only data a
  device owns.
- **Server disk (`storage/app`)**: uploaded stock-import files and generated report exports, kept for a short
  time; product photos, served to the back office and downloaded by the mobile apps for offline display.
- **Off-server backup (DigitalOcean Spaces)**: a nightly MySQL dump, kept for 30 days.
- **Browser**: nothing durable. The back office is online only, so it keeps no business data locally.

### Client state

Where data is stored (MySQL on the server, SQLite on the device) is the source of truth. Client state only
holds what the current screen needs.

- **Back office:** no state library. Page data comes from Inertia props, shared data from
  `HandleInertiaRequests`, forms from `useForm`; anything else is component state. List filters, sorting and
  pages live in the URL query string, so they survive a refresh and can be shared.
- **Counter app:** one small Zustand store per concern:
  - `cart` — lines, box/unit choice, quantities and the lot allocated to each line for the sale in progress.
    Totals, FEFO and currency come from `sales-core` functions; the store keeps their results.
  - `session` — the signed-in cashier and the till code.
  - `sync` — online or offline, number of sales waiting, last successful sync; shown in every screen header.
  Medicines, lots and today's sales are read from SQLite through `sales-core` repositories, not copied into a
  store. Holding a sale saves its cart to the `held_sales` table, so it survives a power cut or app restart;
  only the cart being built may be lost.
- **Manager app:** TanStack Query for everything that comes from the API, with its cache persisted to the
  device so the last data stays readable offline. Its quick sale reuses the counter's `cart` and `sync` stores
  and `sales-core` logic.
- **No Redux** anywhere: the state is small and this setup covers it.

### Sync

1. **Up:** after each sale the device writes a `sale_created` event to its outbox. On reconnect, on
   **Sync now**, and every few minutes while online, it pushes outbox events in batches to `POST /api/v1/sync/push`.
   - **Built so far:** pharm-app pushes right after each sale, every 30 s while online, on reconnect and on
     foreground (`SalesSyncProvider`). Until device registration exists, the device is the token name.
2. **Server ingest:** each event is applied in one transaction and recorded in `sync_events`; an event id seen
   before is acknowledged and skipped. If the lot sold is short, the shortfall moves to the next FEFO lot;
   if no lot can cover it, a `stock_discrepancies` row is created for the pharmacist.
3. **Down:** `GET /api/v1/sync/pull?cursor=` returns medicines, lots, cashiers, settings and rates changed since
   the cursor, plus the server time for the device clock check.
   - **Built so far:** the catalogue part is `GET /api/v1/sync/catalogue?cursor=` (`counter` ability): medicines
     changed since an opaque `(updated_at, id)` cursor, up to 500 per page, deactivated ones included so the
     tablet deletes them, plus every category and `server_time`. pharm-app stores it in SQLite and runs it
     at online sign-in, when NetInfo reports the connection is back, when the app returns to the
     foreground, and every 5 minutes. Accounts come from `GET /api/v1/accounts`. Lots come from
     `GET /api/v1/sync/stock?cursor=` (same cursor, `App\Domain\Sync\SyncCursor`): every lot changed since,
     including used-up ones, checked every minute and on sign-in, reconnect and foreground. Every stock
     movement touches its lot's `updated_at`, which is what sends it down. The tablet keeps the opened pack
     itself and subtracts its unsynced sales from the server quantity. Settings and rates are not pulled
     yet. Changing a medicine's categories must touch the medicine, or tablets miss it.

## Auth and Access Model

- **Back office:** pharmacist and admin sign in with email and password (Laravel session, Inertia pages
  behind the `auth` middleware). Cashiers have no back-office access.
- **Counter tablet:** registered once by the pharmacist, which issues a device token that can only call the
  sync endpoints. Cashiers then sign in on the tablet with username and PIN, checked offline against the PIN
  hash pulled from the server. Every sale records the cashier's user id and the device id.
- **Manager app:** the manager signs in once with email and password (admin role), which issues a device
  token with manager abilities. Viewing works from the last synced data offline; price and stock changes
  need a connection.
- **Roles:** admin (everything, including users and devices) · pharmacist (catalogue, receptions, stock
  operations, reports) · cashier (sell only). Adjustments need a reason and the pharmacist's PIN.
- **Revocation:** revoking a device token in the back office stops that device syncing immediately (for a lost
  or stolen tablet). Deactivating a cashier removes their PIN from devices on the next pull.
- Every API route is authorized server-side by role and token ability; the apps hiding a button is not
  access control.
- **Built so far (until device registration and sync pull exist):** a user token from
  `POST /api/v1/auth/login` (username + PIN; abilities `counter`, plus `back-office` for admin and
  pharmacist) stands in for the device token. With it the tablet downloads `GET /api/v1/accounts` (active
  accounts with username and bcrypt PIN hash) into its SQLite `users` table every 15 minutes while online. Sign-in
  tries the server first; if the server can't be reached or answers 5xx, the PIN is checked on the tablet
  with bcryptjs, and the session has no token. A refusal from the server is never retried offline.
  Accounts are managed by admins on the back-office "Utilisateurs" page; changing the PIN, password, role
  or username, or deactivating an account, revokes its tokens.
- **Receptions** are done only in the web back office (`ReceptionPolicy`: admin, pharmacist), never in the
  mobile apps; there is no device API for them.

## Invariants

1. Stock changes only through the stock ledger service in `app/Domain`: it inserts a `stock_movements` row and
   updates `batches.qty_on_hand` in the same database transaction. No other code writes `qty_on_hand`.
2. `stock_movements` is append-only. Mistakes are corrected with a new movement, never by updating or deleting
   one.
3. Quantities are whole numbers of the smallest unit (tablet, capsule, ampoule). Prices are in the base
   currency. Money is calculated in integer minor units or decimals, never by summing floats.
4. A counter sale is a single SQLite transaction (sale, items, lot deductions, outbox event), so a power cut
   leaves it fully saved or absent.
5. The counter app makes no network call during a sale. Sync runs in the background, and selling never waits
   for it.
6. Every record created on a device has a UUID generated on the device, and the server applies each event id
   at most once.
7. Sales always take the earliest-expiring lot that has stock and has not expired (FEFO). Expired lots are
   never sellable. Both the device and the server's ingest enforce this.
8. A sale stores the currency paid, the exchange rate used and each line's unit price at the time of sale.
   Past sales are never recalculated with a newer rate or price.
9. The server is the source of truth for stock and prices. A device's copy is replaced by pulls, never merged
   back.
10. Business rules live only in `app/Domain`. Inertia controllers and API controllers are thin and call the
    same services, so a reception or adjustment behaves the same from the back office and the manager app;
    React pages in `resources/js` never calculate stock, prices or FEFO themselves.
11. Request handlers do not run long work. Imports, report exports and backups run on the queue.
12. Client stores never hold a second copy of stored data. Anything that must survive a restart (a sale, a held
    sale, an outbox event) is written to SQLite, never kept only in memory.
