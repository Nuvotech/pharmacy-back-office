-- =====================================================================
-- Pharmacy counter tablet — local SQLite database (expo-sqlite)
-- Holds a read-only copy of the catalogue and lots pulled from the server,
-- plus the sales made on this tablet. Every sale works fully offline.
--
-- Open the database with:
--   PRAGMA journal_mode = WAL;     -- survives power loss mid-write
--   PRAGMA foreign_keys = ON;
--
-- A sale is written in ONE transaction:
--   INSERT sales, INSERT sale_items (one per FEFO lot), UPDATE batches.qty_on_hand,
--   INSERT outbox ('sale_created').
-- Either all of it is committed or none of it.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Copies pulled from the server (never edited by the cashier)
-- ---------------------------------------------------------------------
-- Filled from GET /api/v1/accounts (active accounts with a username and PIN), replaced on each download
CREATE TABLE IF NOT EXISTS users (
  id                INTEGER PRIMARY KEY,               -- same id as server users.id
  name              TEXT NOT NULL,
  username          TEXT NOT NULL UNIQUE,              -- typed on the login screen, lower case
  role              TEXT NOT NULL CHECK (role IN ('admin','pharmacist','cashier')),
  pin_hash          TEXT NOT NULL,                     -- server bcrypt hash ($2y$), PIN checked offline
  is_active         INTEGER NOT NULL DEFAULT 1
);

-- Filled from GET /api/v1/sync/catalogue. Only active medicines are kept: a deactivated one is deleted.
-- Prices are decimal strings as the server sends them (CDF), never floats.
CREATE TABLE IF NOT EXISTS medicines (
  id                    TEXT PRIMARY KEY,              -- server UUID
  name                  TEXT NOT NULL,
  dci                   TEXT,
  dosage                TEXT,
  form                  TEXT,
  barcode               TEXT,
  image_path            TEXT,                          -- server public disk, e.g. medicines/quinine.webp
  units_per_pack        INTEGER NOT NULL DEFAULT 1 CHECK (units_per_pack >= 1),
  sale_price_pack       TEXT NOT NULL,                 -- base currency, e.g. "1000.00"
  sale_price_unit       TEXT,                          -- NULL = not sold by unit
  min_stock_units       INTEGER NOT NULL DEFAULT 0,
  prescription_required INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  slug              TEXT PRIMARY KEY,                  -- e.g. paludisme
  name              TEXT NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS medicine_categories (
  medicine_id       TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  category_slug     TEXT NOT NULL,
  PRIMARY KEY (medicine_id, category_slug)
);

-- Filled from GET /api/v1/sync/stock; a lot the server reports at 0 or less is deleted.
-- Sellable units = server_qty minus this tablet's unsynced sales (kept in memory until sales sync exists).
CREATE TABLE IF NOT EXISTS batches (
  id                TEXT PRIMARY KEY,                  -- server UUID
  medicine_id       TEXT NOT NULL,
  lot_number        TEXT NOT NULL,
  expiry_date       TEXT NOT NULL,                     -- YYYY-MM-DD, last day of the expiry month
  server_qty        INTEGER NOT NULL,                  -- units on the server at the last download
  opened_pack_units INTEGER NOT NULL DEFAULT 0,        -- units left in the pack opened on this tablet
  received_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS batches_fefo_index ON batches (medicine_id, expiry_date);

-- Latest exchange rate and settings pushed down by the server
CREATE TABLE IF NOT EXISTS settings (
  key               TEXT PRIMARY KEY,                  -- base_currency, usd_to_cdf, rate_date,
  value             TEXT                               -- expiry_alert_days, pharmacy_name, receipt_footer, device_code
);

-- Instant offline search on name, DCI and barcode
CREATE VIRTUAL TABLE IF NOT EXISTS medicines_fts USING fts5(
  name, dci, barcode,
  content = 'medicines', content_rowid = 'rowid',
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS medicines_ai AFTER INSERT ON medicines BEGIN
  INSERT INTO medicines_fts (rowid, name, dci, barcode) VALUES (new.rowid, new.name, new.dci, new.barcode);
END;
CREATE TRIGGER IF NOT EXISTS medicines_ad AFTER DELETE ON medicines BEGIN
  INSERT INTO medicines_fts (medicines_fts, rowid, name, dci, barcode) VALUES ('delete', old.rowid, old.name, old.dci, old.barcode);
END;
CREATE TRIGGER IF NOT EXISTS medicines_au AFTER UPDATE ON medicines BEGIN
  INSERT INTO medicines_fts (medicines_fts, rowid, name, dci, barcode) VALUES ('delete', old.rowid, old.name, old.dci, old.barcode);
  INSERT INTO medicines_fts (rowid, name, dci, barcode) VALUES (new.rowid, new.name, new.dci, new.barcode);
END;

-- ---------------------------------------------------------------------
-- Created on this tablet
-- As built in pharm-app (migration 4): `sales` keeps the whole sale as JSON
--   (id, receipt_no UNIQUE, sold_at, record TEXT, synced_at), and `outbox` has
--   (id, type, payload, created_at, status 'pending'|'failed', attempts, last_error).
-- The detailed tables below are the target design; sale_items are on the server.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id                TEXT PRIMARY KEY,                  -- UUID generated on the tablet
  receipt_no        TEXT NOT NULL UNIQUE,              -- e.g. C1-20261010-0042
  user_id           INTEGER NOT NULL REFERENCES users(id),
  total             REAL NOT NULL,                     -- base currency
  currency_paid     TEXT NOT NULL CHECK (currency_paid IN ('USD','CDF')),
  exchange_rate     REAL NOT NULL,
  amount_paid       REAL NOT NULL,                     -- in currency_paid
  change_given      REAL NOT NULL DEFAULT 0,
  payment_method    TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','mobile_money')),
  payment_ref       TEXT,
  sold_at           TEXT NOT NULL,                     -- device local time, ISO 8601
  synced_at         TEXT                               -- NULL until the server accepted it
);
CREATE INDEX IF NOT EXISTS sales_sold_at_index ON sales (sold_at);

CREATE TABLE IF NOT EXISTS sale_items (
  id                TEXT PRIMARY KEY,
  sale_id           TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  medicine_id       TEXT NOT NULL REFERENCES medicines(id),
  batch_id          TEXT NOT NULL REFERENCES batches(id),
  sell_mode         TEXT NOT NULL CHECK (sell_mode IN ('pack','unit')),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  qty_units         INTEGER NOT NULL CHECK (qty_units > 0),
  unit_price        REAL NOT NULL,
  line_total        REAL NOT NULL
);

-- Sales put on hold to serve another customer. Saved here, not only in memory,
-- so a held sale survives a power cut or app restart. Deleted when resumed or cancelled.
-- No stock is reserved: FEFO lots are allocated again when the sale is resumed.
CREATE TABLE IF NOT EXISTS held_sales (
  id                TEXT PRIMARY KEY,                  -- UUID
  user_id           INTEGER NOT NULL REFERENCES users(id),
  label             TEXT,                              -- optional: customer name or note
  cart              TEXT NOT NULL,                     -- JSON: lines with medicine_id, sell_mode, quantity
  held_at           TEXT NOT NULL                      -- device local time, ISO 8601
);

-- Events waiting to be pushed to the server (deleted once acknowledged)
CREATE TABLE IF NOT EXISTS outbox (
  id                TEXT PRIMARY KEY,                  -- event UUID = server sync_events.id
  type              TEXT NOT NULL,                     -- 'sale_created'
  payload           TEXT NOT NULL,                     -- JSON: sale + items
  created_at        TEXT NOT NULL,
  attempts          INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT
);

-- Sync bookkeeping: pull cursors, last successful sync, receipt counter
CREATE TABLE IF NOT EXISTS sync_state (
  key               TEXT PRIMARY KEY,                  -- medicines_cursor, batches_cursor,
  value             TEXT                               -- last_sync_at, receipt_seq
);

-- ---------------------------------------------------------------------
-- What the cashier sees: sellable lots in FEFO order (expired lots excluded)
--   SELECT * FROM v_fefo_lots WHERE medicine_id = ? ORDER BY expiry_date;
-- ---------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_fefo_lots AS
SELECT b.id AS batch_id, b.medicine_id, b.lot_number, b.expiry_date, b.qty_on_hand,
       CAST(julianday(b.expiry_date) - julianday(date('now','localtime')) AS INTEGER) AS days_left
FROM batches b
WHERE b.qty_on_hand > 0
  AND b.expiry_date > date('now','localtime');

CREATE VIEW IF NOT EXISTS v_today_sales AS
SELECT user_id, currency_paid, COUNT(*) AS sales_count, SUM(total) AS total_base,
       SUM(amount_paid - change_given) AS cash_in_currency
FROM sales
WHERE date(sold_at) = date('now','localtime')
GROUP BY user_id, currency_paid;
