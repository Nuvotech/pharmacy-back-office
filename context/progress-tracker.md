# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Feature spec 02 — Medicines (`context/feature-specs/02-medicament.md`): seeded catalogue with categories
  and pictures, shown in the Médicaments list.

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

## In Progress

- 04 Medicines (spec `02-medicament.md`) — code done, local database seeded; not yet checked in the browser.
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
    the name is an addition to the design. Pest: `MedicineListTest`, `MedicineSeederTest`. 112/112.
  - Not committed: the server folder is not a git repository and you chose not to create one.
- 05 Catalogue download to the tablet — code done; live pull against the local server checked (4 pages,
  1,745 medicines, 38 with a picture); not yet run on the tablet.
  - Server: `GET /api/v1/sync/catalogue?cursor=` (`App\Domain\Sync\PullCatalogue`, `SyncController`,
    `SyncMedicineResource`, `abilities:counter`). Pest: `tests/Feature/Api/V1/SyncCatalogueTest.php`. 119/119.
  - pharm-app: `@react-native-community/netinfo` 12.0.1 (in Expo Go). `src/api/connectivity.ts` wires NetInfo
    and app focus into TanStack Query; `src/api/catalogue.ts`, `src/data/catalogueSync.ts` (page loop, restarts
    on `INVALID_CURSOR`), `src/data/catalogue.ts` (server medicine → counter `Product`), SQLite migration 2 +
    `src/db/catalogue.ts` (memory fallback without SQLite), `src/store/catalogue.tsx` (`CatalogueProvider`,
    `useCatalogue`, `findProduct` reads it). The counter grid and categories use the downloaded catalogue;
    bundled pictures are used by file name, other photos load from the server. The tablet Réception
    screen stays on sample products (`findProduct` in `src/data/reception.ts`). Jest 106/106, `tsc`, lint,
    Android bundle.
  - Only an online sign-in (with a token) downloads; an offline session shows what is already stored.
  - Offline sign-in in Expo Go (no SQLite module): the downloaded accounts now fall back to the device
    keystore (`expo-secure-store`) in `src/db/accounts.ts`, so offline sign-in works there too. The
    catalogue still falls back to memory only in Expo Go, so it is downloaded again after a restart.
  - The Vente status line shows the real connection ("En ligne" / "Hors ligne", from NetInfo through
    `useIsOnline` in `src/api/connectivity.ts`) and, only when there are some, the sales made this session
    ("· N en attente"; sales aren't pushed yet). The mock `syncStatus` (offline, 12 waiting) is removed.
    While online its dot is green (`colors.onlineDot`, new token) with a ping like Tailwind's `animate-ping`
    (`StatusPill`, inline variant only).
  - Stock is not pulled yet (lots, through the stock ledger and sync pull), so every downloaded medicine
    shows "Rupture" at the counter and can't be sold.

## Next Up

- Check the Médicaments list in the browser, then move 04 to Completed.
- Medicine form ("Modifier", "Nouveau médicament") loading and saving from the database.

## Open Questions

- The medicine form ("Modifier", "Nouveau médicament") still shows mock data: opening a seeded medicine
  says "Médicament introuvable". Next unit: load and save the form from the database.
- PHARMAPLUS medicines have only a name: price 0, 1 unit per pack, minimum 0, no category, no stock, so the
  whole list shows "Rupture" until prices are entered and the opening stock is imported.
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

## Session Notes

- Server tests: `php artisan test --compact tests/Feature/Api`. App tests: `npx jest` in pharm-app.
