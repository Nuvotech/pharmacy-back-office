# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Units 01–10 complete; next feature spec to be chosen.

## Completed

- 01 Authentication (spec `01-authentication.md`).
  - Server: `laravel/sanctum`; migration adds `users.username`; `App\Enums\Role`;
    `App\Domain\Auth\IssueApiToken`; `POST /api/v1/auth/login`, `GET /api/v1/auth/me`,
    `POST /api/v1/auth/logout`; API errors use `{ message, code, errors }` with French text from
    `lang/fr/api.php`; rate limiters `api` (60/min) and `api-login` (5/min). Pest:
    `tests/Feature/Api/V1/AuthTest.php`.
  - Public registration (`/register`) and email verification are turned off; admins create accounts.
  - Seeded logins: cashiers `grace.m` / 1234 and `patrick.k` / 2468 (tablet only); admin `j.mbuyi` / 5678
    on the tablet and `mbuyi@example.com` / `password` in the back office.
  - pharm-app (`C:\Projects\Clients\pharmacy\pharm-app`): `@tanstack/react-query`, `expo-secure-store`;
    `src/api/client.ts` (fetch, 30 s timeout, `X-App-Version`, `ApiError`), `src/api/auth.ts`,
    `src/api/queryClient.ts`, `src/store/authToken.ts`; `SessionProvider` signs in and unlocks through the
    API; `LoginScreen` uses `useMutation`. Pharmacists reach the tablet back office. Needs
    `EXPO_PUBLIC_API_URL` in `.env.local`.
- 02 User management: admin-only "Utilisateurs" page (`users/index`, `users/form`; sidebar → Système):
  name, role, username + PIN (tablet), email + password (back office, not for cashiers), active.
  `App\Domain\Users\SaveUser`, `UserPolicy` (admin only), `StoreUserRequest` / `UpdateUserRequest` (French
  messages in `lang/fr/users.php`; an admin can't deactivate or demote themselves). Blank PIN/password keep
  the current one. Changing PIN, password, role or username, or deactivating, revokes the account's tokens.
  `TextField` / `SelectField` gained an `error` prop. Pest: `tests/Feature/BackOffice/UserManagementTest.php`.
  No design exists; styled like Médicaments.
- 03 Offline sign-in. Server: `GET /api/v1/accounts` (`counter` ability; active accounts with username and
  PIN hash), Sanctum `abilities` middleware alias; PINs hashed at bcrypt cost 8 and re-hashed at the next
  online sign-in. pharm-app: `expo-sqlite` + `bcryptjs`; `src/db/` (database with `user_version`
  migrations, accounts repository; SQLite loaded lazily, so a build without it still works online),
  `src/api/accounts.ts`, `src/data/signIn.ts` (server first with a 3 s timeout, offline fallback on network
  error or 5xx), `src/utils/pin.ts`. The session (user + optional token) is stored in secure-store, so a
  restart works offline. Accounts re-download every 15 min while online; a signed-in user missing from the
  new list is signed out. Offline sign-in needs a development build (Expo Go lacks the SQLite module).
  - pharm-app dependencies aligned with Expo SDK 58 (`react-dom` pinned to 19.3.0, `npx expo install --fix`);
    a plain `npm install` works and `expo-doctor` passes.
- 04 Medicines (spec `02-medicament.md`).
  - Seeded from the PHARMAPLUS list (`database/seeders/data/medicines_pharmaplus.csv`, 1,745 names; moved
    there from the repo-root `data/` folder, where the seeder couldn't find it), not from the mock data.
  - Migration `create_categories_and_add_image_to_medicines`: `categories` table + `category_medicine` pivot
    (a medicine can be in several categories), `medicines.image_path`; drops the unused `medicines.category`.
  - `CategorySeeder`: the 5 counter categories (Paludisme, Antibiotiques, Douleur, Enfants, Vitamines).
  - `MedicineSeeder::PRODUCT_IMAGES`: the 15 counter pictures (copied to
    `database/seeders/data/medicine-images`) matched by exact name to 38 medicines, with the counter's
    categories. Stored as WebP ≤ 400 px by `App\Domain\Catalogue\StoreMedicinePhoto` on the public disk
    (`php artisan storage:link` needed). Existing photos and categories are never overwritten.
  - `base_currency` is now CDF (`SettingsSeeder`); `DatabaseSeeder` calls the settings and medicine seeders.
  - Médicaments list (`MedicineController@index`, `MedicineListResource`): search, category, status chips
    and page in the query string, 25 per page; stock and status computed on the server
    (`Medicine::withSellableUnits`, `App\Enums\StockStatus`, expired lots excluded). A 36 px picture beside
    the name is an addition to the design. Pest: `MedicineListTest`, `MedicineSeederTest`.
  - Not committed: the server folder is not a git repository and you chose not to create one.
- 05 Catalogue download to the tablet.
  - Server: `GET /api/v1/sync/catalogue?cursor=` (`App\Domain\Sync\PullCatalogue`, `SyncController`,
    `SyncMedicineResource`, `abilities:counter`). Pest: `tests/Feature/Api/V1/SyncCatalogueTest.php`.
  - pharm-app: `@react-native-community/netinfo` 12.0.1 (in Expo Go). `src/api/connectivity.ts` wires NetInfo
    and app focus into TanStack Query; `src/api/catalogue.ts`, `src/data/catalogueSync.ts` (page loop, restarts
    on `INVALID_CURSOR`), `src/data/catalogue.ts` (server medicine → counter `Product`), SQLite migration 2 +
    `src/db/catalogue.ts` (memory fallback without SQLite), `src/store/catalogue.tsx` (`CatalogueProvider`,
    `useCatalogue`, `findProduct` reads it). The counter grid and categories use the downloaded catalogue;
    bundled pictures are used by file name, other photos load from the server.
  - Only an online sign-in (with a token) downloads; an offline session shows what is already stored.
  - Offline sign-in in Expo Go (no SQLite module): the downloaded accounts fall back to the device keystore
    (`expo-secure-store`) in `src/db/accounts.ts`. The catalogue falls back to memory only in Expo Go, so it
    is downloaded again after a restart.
  - The Vente status line shows the real connection ("En ligne" / "Hors ligne", from NetInfo through
    `useIsOnline` in `src/api/connectivity.ts`) and, only when there are some, the sales made this session
    ("· N en attente"; sales aren't pushed yet). While online its dot is green (`colors.onlineDot`) with a
    ping like Tailwind's `animate-ping` (`StatusPill`, inline variant only).
- 06 Receptions (spec `03-Receptions.md`). Not committed: neither folder is a git repository.
  - Stock ledger (high-risk, tests first): `App\Domain\Stock\RecordStockMovement` is the only code that
    changes `batches.qty_on_hand`; it locks the lot, appends a `stock_movements` row and increments the
    quantity in one transaction, and refuses a zero movement. `App\Enums\MovementType` mirrors the column.
    Pest: `tests/Feature/Stock/RecordStockMovementTest.php`.
  - Migrations `add_draft_fields_and_lines_to_receptions` (`receptions.status` draft | validated,
    `currency` USD | CDF, `exchange_rate`, `validated_at`; new `reception_lines`) and
    `add_units_per_pack_to_reception_lines`.
  - Models `Supplier`, `Reception`, `ReceptionLine`, `Batch`, `StockMovement`, `ExchangeRate`; enums
    `ReceptionStatus`, `InvoiceCurrency`; `ReceptionPolicy` (admin and pharmacist).
  - `App\Domain\Receptions\SaveReceptionDraft` (creates no lot; lines replaced on each save) and
    `ValidateReception` (one lot + one `reception` movement per line; purchase price per unit stored in CDF
    = cost per pack × rate ÷ units per pack; USD needs the rate in force on the reception date; lots
    expiring under 6 months need `short_dated_confirmed`; validating an already validated reception
    returns it unchanged; a box size different from the medicine sheet is saved on the medicine).
    `ShortDated` holds the 6-month rule. French messages in `lang/fr/receptions.php`.
  - Back office `receptions/create` (`BackOffice\ReceptionController`: reopens the user's latest draft;
    `POST receptions/draft`, `POST receptions/validate`). Same layout as the design; the entry row has a
    "Unités / bte" box prefilled from the medicine, an "Ajouter" button, Enter moves to the next empty box;
    a filled entry row counts on save/validate; Enter in a header field never validates. Added to the
    design: a "Je confirme ces lots" checkbox, a line-error list under the table.
  - Receptions are web back office only (your decision, 30/10/2026): the tablet Réception screen was
    removed and there is no device API for them; the tablet back office opens on Stock.
  - Seeders: `SupplierSeeder` (placeholders `[GROSSISTE A]`, `[GROSSISTE B]`); `DatabaseSeeder` adds a
    local USD rate of 2 800 for today. Pest: `BackOffice/ReceptionTest.php`.
- 07 Stock download to the tablet.
  - Server: `GET /api/v1/sync/stock?cursor=` (`App\Domain\Sync\PullStock`, `SyncBatchResource`,
    `PullStockRequest`, `abilities:counter`); the cursor code moved from `PullCatalogue` to `SyncCursor`
    (shared, unchanged behaviour). Pest: `tests/Feature/Api/V1/SyncStockTest.php`.
  - pharm-app: `src/api/stock.ts`, SQLite migration 3 (`batches`) + `src/db/stock.ts` (memory fallback in
    Expo Go), `src/store/stock.tsx` (`StockProvider`: pull every 60 s and on sign-in, reconnect, foreground;
    `getLots`/`setLots`/`useLotsVersion`), `src/data/stockLots.ts` (`toLot`). `data/catalogueSync.ts` has a
    shared `syncPages`. The counter sells from the downloaded lots; `Lot` has the server `id` and FEFO keys
    lots by id (two deliveries can share a lot number).
  - Sales are still not pushed: a sale lowers the lot on the tablet and the units sold are remembered in
    memory per lot, so a download doesn't bring them back; after an app restart they are forgotten (as are
    the sales themselves). The opened pack is saved on the tablet.
  - Local testing through ngrok needs `ngrok http pharmacy.test:80 --host-header=rewrite`; without it Herd
    answers 404 to every tablet request.
- 08 Medicine form from the database.
  - "Modifier" and "Nouveau médicament" load and save real medicines (`MedicineController@create/store/
    edit/update`, `SaveMedicineRequest`, `App\Domain\Catalogue\SaveMedicine`, `MedicinePolicy`: admin and
    pharmacist; French messages in `lang/fr/medicines.php`). Same layout as the design. Prices are whole FC;
    unchecking "Vendre aussi à l'unité" clears the unit price. Saving always touches the medicine, so
    tablets get the change on their next catalogue pull.
  - The "Catégorie" select edits the main category; other categories are kept and listed under it ("Aussi
    dans : …"). "Forme" and "Catégorie" allow "—" (seeded medicines have neither).
  - "Lots en stock" lists the real sellable lots in FEFO order with their cost per box; the margin uses the
    latest lot received; "≈ USD" uses the rate in force today ("—" without one).
  - Pest: `BackOffice/MedicineFormTest.php`; `BackofficeRoutesTest` opens a real medicine. Server 146/146;
    pharm-app jest 107/107.
- 09 Sales sync and dashboard (spec `04-dashboard.md`). Not committed: neither folder is a git repository.
  - Server (high-risk, tests first): `POST /api/v1/sync/push` (`SyncController@push`, `PushSyncRequest`: at
    most 200 events, `abilities:counter`). `App\Domain\Sync\IngestSyncBatch` applies each event in its own
    transaction and logs it in `sync_events`; an event id seen before is `duplicate`, a bad one `failed`
    (logged, the others still apply), an unexpected error `server_error` (not logged, resent).
    `App\Domain\Sales\RecordSale` writes `sales` + one `sale_items` row per lot and takes the units through
    the ledger (`sale` movement); a shortfall moves to the next FEFO lot (`sync_reallocation` movement), and
    what no lot covers becomes a `stock_discrepancies` row. The answer returns the changed lots' quantities.
    Migration `add_prescription_to_sales` (prescriber, patient name). Models `Device`, `Sale`, `SaleItem`,
    `SyncEvent`, `StockDiscrepancy`; `Medicine::batches()`.
  - Devices: no registration yet, so `App\Domain\Sync\ResolveDevice` uses the token name the app signs in
    with ("Caisse 1") and creates the device on first sync; stock pulls and pushes update `last_sync_at` and
    `last_user_id` (migration `add_last_user_to_devices`). The dashboard's "Appareils" shows each device's
    name with the cashier signed in and its status, e.g. "Caisse 1 — Grâce M. · En ligne". A device is
    online if it synced in the last 2 minutes; the dashboard refreshes its figures every 30 s (`usePoll`,
    `only: ['summary']`), so a tablet going offline shows within about 2½ minutes.
  - pharm-app: `expo-crypto` installed (your approval) for sale and event UUIDs. SQLite migration 4 (`sales`
    with the sale as JSON + `synced_at`, `outbox`), `src/db/sales.ts` (sale + outbox + receipt counter in one
    transaction; memory fallback in Expo Go, receipt counter in the keystore there), `src/api/sync.ts`,
    `src/data/salesSync.ts` (`toSaleEvent`, `pushPendingSales` in batches of 200),
    `src/store/salesSync.tsx` (`SalesSyncProvider`: push every 30 s, after each sale, on reconnect and
    foreground; pending count). Sold units are subtracted from downloaded lots until the server has the
    sale (from the stored unsynced sales, so it survives a restart); the server's lot quantities replace
    them after a push. Today's sales and the receipt counter are read back from the tablet at start.
    Jest 117/117, `tsc`, lint, Android bundle.
  - Dashboard (`DashboardController`, `App\Domain\Reports\DashboardSummary`): today's sales and tickets,
    stock value at purchase price (non-expired lots), counts of out of stock (every active medicine at 0,
    your choice), low, expiring within 90 days and expired lots, up to 10 alerts per kind (medicines that
    had stock first), last 3 validated receptions, devices (online if synced in the last 2 min) plus
    "Ce navigateur", today's rate, the user's role. Ruptures/Stock bas tiles open the filtered list.
    Pest: `Api/V1/SyncPushTest.php`, `BackOffice/DashboardTest.php`. Server 157/157.
- 10 Inventory (spec `05-Inventaire.md`). Not committed: the server folder is not a git repository.
  - `InventoryCount`, `InventoryCountLine` models (existing tables); `InventoryCountPolicy` (admin and
    pharmacist); French messages in `lang/fr/inventory.php`.
  - `App\Domain\Inventory\StartInventoryCount` (one open count at a time; one line per lot with stock, with
    the units expected at that moment), `RecordCountedUnits` (open count only; blank = "à compter"),
    `CloseInventoryCount` (each counted lot with a difference gets an `inventory_correction` movement of
    counted − expected through the stock ledger, signed by the user, reason "Inventaire du JJ/MM/AAAA";
    uncounted lots keep their quantity).
  - `InventoryController`: `GET inventory`, `POST inventory` (start), `PATCH inventory/lines/{line}` (saved
    when leaving the box or on Enter), `POST inventory/{count}/close` (after a confirmation).
  - Page `inventory/index` on real data, same layout as the design: title from the month the count opened,
    progress, lots with a difference, value of the differences at purchase price, search, filters, table.
    Without an open count it shows "Démarrer l'inventaire" (not in the design). Changed from the design:
    the subtitle no longer says sales are blocked (they aren't), the progress note says how many lots are
    left (there are no shelves), the "Rayon" column shows "—", the search is by medicine or lot. Mock
    `lib/mock/inventory.ts` removed. Pest: `BackOffice/InventoryTest.php`. Server 164/164.

## In Progress

- 12 Reports (spec `07-Ventes-reports.md`) — code done and tested; not yet checked in the browser. Not
  committed: the server folder is not a git repository.
  - `App\Domain\Reports\SalesReport` (one month, the current one to today; synced sales, returned ones left
    out): sales per day split cash / mobile money, total, tickets, 10 best sellers by revenue (boxes and units
    sold), last sync time. `ConsumptionReport`: units sold per medicine over the last 6 months, average, stock,
    cover (stock ÷ average), boxes to order for 2 months of cover; purchase value of expired lots in stock and
    of those expiring in each of the next 3 months.
  - `ReportController` behind the `view-reports` gate (admin, pharmacist; `AppServiceProvider`): pages plus
    Excel exports (`ventes-AAAA-MM.xlsx` with two sheets, `consommation-….xlsx`, and "Bon de commande suggéré" =
    `bon-de-commande-….xlsx` with the medicines to order). Laravel Excel 4 multi-sheet exports implement
    `Concerns\Export`.
  - Pages `reports/sales` (period picker over the last 6 months, in the URL) and `reports/consumption` on real
    data, same layout as the designs; `SalesChart` now scales its axis to the data and names the month.
    Consumption is shown in units (with the box size) and "À commander" in boxes. Still not built: "Exporter
    PDF" (no PDF library) and the "Autres rapports" list. Mocks `sales-report.ts`, `consumption.ts` removed.
    Pest: `BackOffice/ReportsTest.php`. Server 186/186.
- 11 Stock import (spec `06-import-du-stock.md`) — code done and tested; not yet checked in the browser. Not
  committed: the server folder is not a git repository.
  - Dependency (your approval): `maatwebsite/excel` 4.0.6 (Laravel Excel, as in architecture.md). Version 4
    needs import classes to implement `Concerns\Import` (`App\Imports\StockFileImport`) and the reader type
    passed explicitly for uploads.
  - Template columns (`CheckStockFile::COLUMNS`): `nom`, `dci`, `numero_lot`, `date_expiration`, `quantite`
    (boxes, your choice), `unites_par_boite`, `prix_boite`, `prix_unite`, `prix_achat_boite` (sale and purchase
    prices in FC, your choice). Headers are read without accents or case.
  - `App\Domain\Stock\Import\ReadStockFile` (.xlsx or .csv, ≤ 5 MB, ≤ 5 000 rows, required columns) and
    `CheckStockFile` (pure: dates as Excel dates, JJ/MM/AAAA, AAAA-MM-JJ or MM/AAAA = end of month; the
    design's errors: empty or past date, text instead of a number, 0 units per box, negative quantity,
    duplicate lot; plus a different box size for the same medicine; empty rows skipped; lot number optional).
  - Migration `create_stock_imports_table` (checked rows and errors kept until imported; a new upload
    replaces the user's file being checked). `App\Domain\Stock\Import\ImportOpeningStock` (all or nothing,
    once): one "Stock initial" reception (`is_opening_stock`), one lot per row with an `opening_stock`
    movement through the ledger; unknown medicines are created (your choice), existing ones take the file's
    box size and sale prices; a missing lot number becomes `INIT-AAAAMMJJ-<ligne>`. Queued (your request,
    30/10/2026): `StartOpeningStockImport` marks the file `importing` and dispatches `App\Jobs\ImportOpeningStock`
    after commit (1 try; a failure marks the file `failed`, and the page offers "Relancer l'import"). The page
    shows "Import en cours…" and checks every 2 s until the summary is ready.
  - `StockImportController` (`StockImportPolicy`: admin, pharmacist): page, upload, template download
    (`modele-stock-initial.xlsx`), error list download (`erreurs-import-stock.xlsx`), import. French messages in
    `lang/fr/stock_import.php`.
  - Page `stock-import/create` on real data with the design's 4 steps: Modèle (instructions and file choice, not
    in the design), Vérification (as in the design, 50 errors shown), Import (summary, not in the design).
    Mock `lib/mock/stock-import.ts` removed. Pest: `Stock/CheckStockFileTest.php`,
    `BackOffice/StockImportTest.php` (CSV and real .xlsx). Server 180/180.

## Next Up

- Next feature spec to be chosen (see Open Questions for gaps found so far).

## Open Questions

- Back-office restyle (design.md, 30/10/2026): design.md has only green (good) and red (bad), but the
  pharmacy also shows in-between states (stock bas, expire bientôt, hors ligne, short-dated lots). These use
  amber (`--color-warning*` in tokens.css). Confirm, or say which design.md colour to use instead. The tablet
  apps keep their own design (navy / cyan); only the web back office changed.

- "Retours" and "Ajustements" are parked (your decision, 30/10/2026): their sample screens are greyed out,
  unclickable (`inert`) and covered by a "… · bientôt disponible" notice until they are built. The
  dashboard's "Voir le lot" / "Retirer" links and the consumption report's "Gérer les lots" still lead there.

- Reports: "Exporter PDF" needs a PDF library (DomPDF is named in architecture.md, not installed); the
  "Autres rapports" (stock status, purchases by supplier, closed counts, movements per lot, most used) have no
  design or spec yet.

- The stock import needs a queue worker (`php artisan queue:work`, or `composer run dev`, which starts one).
  Production needs a supervised worker (Supervisor or systemd) on the droplet.


- Shop time zone: the server runs in UTC (`app.timezone`), so "Ventes du jour" counts sales from 00:00 UTC
  (01:00 in Kinshasa, 02:00 in Lubumbashi). Which time zone is the pharmacy in?
- The tablet still uses the sample rate (2 800 FC, `exchangeRate` in `src/data/mock.ts`) at the counter;
  the server's rate isn't pulled yet.
- Sales refused by the server (e.g. a receipt number already used) stay on the tablet marked failed; there is
  no screen to see them yet. Stock discrepancies have no screen either.

- Receptions: no screen exists to enter the day's USD → FC rate, so a USD invoice can't be validated until a
  rate is in `exchange_rates` (`DatabaseSeeder` adds 2 800 for local testing). Needs a design.
- Receptions: the overview lists a sale price per reception line; neither design has one, so prices stay
  on the medicine sheet. Confirm.
- Receptions: suppliers can't be managed yet (only the two seeded placeholders); the real supplier list is
  a client deliverable. A supplier screen needs a design.
- Lot history page (Phase 1 item 4) and a list of past receptions: no design yet.
- `batches.expiry_date` is the last day of the expiry month, and `Medicine::withSellableUnits` keeps lots
  with `expiry_date > today`, so the server stops counting a lot on its last day while the tablet sells it
  until the end of that day. Align the rule.

- PHARMAPLUS medicines have only a name: price 0, 1 unit per pack, minimum 0, no category, no stock. Prices
  and box sizes can now be set in the medicine form (08) and at reception (06).
- Picture matches to confirm: Artésunate (the list has only 60 mg / 120 mg, likely injections, while the
  picture is a tablet box) and Fer + Acide folique (matched to FERCEFOL / FEFOL).

- Sign-in speed: measured ~30 s on the tablet; target is 5 s or less. Fixed by hashing PINs at bcrypt cost 8 and a
  3 s sign-in timeout (see Architecture Decisions). Confirm the time on the real tablet, both online and offline.
- An offline sign-in has no API token, so nothing is downloaded until someone signs in online again. Device
  registration (one device token per tablet) would remove this; it is part of the sync API unit.
- Any `counter` token can download every account's PIN hash. A 4–8 digit PIN can be brute-forced from its
  hash, so a stolen tablet exposes PINs; revoking its token stops further downloads only.
- `packages/api-types` and Scribe (`docs/api/`) do not exist yet, so the API types live in pharm-app
  `src/api/auth.ts` and no OpenAPI spec was generated. Repo layout also differs from `AGENTS.md`: the Laravel
  app is at the repo root, not `apps/server`, and the mobile app is the separate `pharm-app` project.

## Architecture Decisions

- Back office restyled to design.md (your request, 30/10/2026): `resources/css/tokens.css` keeps the token names
  the pages use but takes design.md's values (slate-100 canvas, white cards, slate-800 sidebar, blue-600 accent,
  green / red status, 4 px radius, design.md card shadow); Poppins 400/500/600 replaces IBM Plex
  (`vite.config.ts`), and `font-mono` now means Poppins with tabular figures. The shell follows design.md 4.2:
  fixed 256 px sidebar with a slate-900 logo bar, section labels and Lucide icons (drawer under 1024 px), a
  70 px white top bar with the signed-in user, and a 60 px page-header band (title | breadcrumb or subtitle,
  actions on the right). Shared components follow design.md 6: Card (56 px header with divider, 24 px
  padding), StatTile (KPI variant A, white with a coloured value), Button (38 px, secondary slate-100), fields
  and search (38 px, slate-300 border, blue focus ring), DataTable (slate-50 header, no row dividers, hover),
  Badge (22 px), filter pills, pagination footer, stepper. The dashboard no longer repeats the user in its
  header.

- Inventory follow-up (your choices, 30/10/2026): the shelf ("Rayon") is kept on the medicine
  (`medicines.shelf`, migration `add_shelf_to_medicines`), set in the medicine form and by the stock import's
  optional `rayon` column; the inventory lists lots shelf by shelf (no shelf last) and searches by shelf.
  Sales are not blocked during a count (counts run after closing; corrections are counted − expected at the
  start). "Imprimer la feuille de comptage" opens a print page (`GET inventory/{count}/print`, Blade view
  `inventory/print`) in a new tab: lots by shelf with an empty "Compté" box, print dialog on load.

- PINs are hashed with bcrypt cost 8 (`User::PIN_HASH_ROUNDS`), passwords keep cost 12. The tablet checks
  PINs offline in JavaScript without a JIT, where cost 12 took ~4 s on a laptop and over 10 s on the tablet;
  cost 8 takes ~0.25 s on the laptop. A 4–8 digit PIN is protected by the lock and token revocation, not
  by the cost. Older hashes are re-hashed at the user's next online sign-in.
- Sign-in waits 3 s for the server (`loginTimeoutMs` in pharm-app), then checks the PIN on the tablet;
  other requests keep 30 s. Worst case is about 3 s plus the PIN check.

- API tokens expire after 12 hours (one working day) and are one per user and device name: limits the damage
  of a lost tablet without making staff sign in mid-shift.
- Every failed sign-in (unknown username, wrong PIN, inactive, no PIN) returns the same
  `INVALID_CREDENTIALS` response, so the API does not reveal which usernames exist.
- Email verification removed (`MustVerifyEmail`, `verified` middleware, Fortify feature, verify-email page
  and its tests): the custom users table has no `email_verified_at`, and accounts are created by the admin.
- The reporting-views migration (`2026_10_10_000008`) skips itself on SQLite: its SQL is MySQL-only, and the
  test suite runs on in-memory SQLite. The views are therefore not covered by tests.
- Receptions happen only in the web back office (30/10/2026); the box size typed at reception updates the
  medicine sheet on validation.

## Session Notes

- Deployment: create the real administrator with `php artisan pharmacy:create-admin` (asks name, e-mail,
  password twice, and optionally a tablet username + PIN; strong passwords in production). Then deactivate
  the seeded test accounts (`mbuyi@example.com`, `test@example.com`, `j.mbuyi`, `patrick.k`, `grace.m`) in
  "Utilisateurs". Pest: `tests/Feature/Console/CreateAdminTest.php`.

- Server tests: `php artisan test --compact tests/Feature/Api`. App tests: `npx jest` in pharm-app.
