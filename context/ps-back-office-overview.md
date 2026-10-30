# Pharmacy System — Project Plan: Phases 1, 3 and 4

Oct 23, 2026 · @Demto

Phases 1, 3 and 4 build the back office: 10 weeks of work in a 16-week programme, with the counter app (Phase 2, separate plan) in weeks 6–11. Estimates assume one full-time developer; week 1 starts on the agreed start date.

## Overview

The back office is where the pharmacy's stock is run: medicines and prices, deliveries into lots, expiry dates, corrections and reports. The pharmacist works in it on the back-room tablet and the laptop, and the manager follows the business from a phone. It replaces stock kept on paper or from memory, which leads to running out of key medicines, money lost to expired stock and no clear view of the day's sales. Its server is the single source of truth that the counter tablet syncs with.

## Goals

1. All stock tracked by lot and expiry date: the opening stock imported in one session, and every delivery after that received through the system.
2. No expired medicine sold: expired lots are blocked automatically and written off within a week of expiring.
3. Fewer stock-outs: every medicine at or below its minimum shows in the alerts the same day.
4. System stock matches the shelves: the monthly inventory difference stays under 2% of stock value.
5. The manager sees today's sales, sales waiting to sync and stock alerts from a phone, without being at the shop.

## Core user flow

1. The pharmacist signs in on the back-room tablet or laptop and enters today's USD→CDF rate.
2. A delivery arrives: they create a reception with the supplier, invoice number and invoice currency (USD or FC), then one line per product with lot, expiry, quantity, unit cost and sale price, scanning cartons where possible. The system warns on any expiry under 6 months.
3. They save it as a draft or validate it; validated lots go to the counter on its next sync.
4. During the day the manager opens **Today** on the phone: synced sales, sales waiting to sync, cash vs mobile money, each device's sync status and the top sellers.
5. From **Alerts** (out of stock, low stock, expiring soon) the manager opens a product — stock, lots in selling order, last 7 days of sales — and prepares a supplier order.
6. As needed, the pharmacist records returns and adjustments and removes expired lots; once a month they run an inventory count after closing.
7. At month end they export the sales, purchases and consumption reports to PDF or Excel.

## Features

### Catalogue and receptions (Phase 1)

- Medicines: name, DCI, dosage, form, category, barcode, prescription flag, units per pack, pack and unit price, minimum stock
- Opening-stock import from Excel/CSV, with every bad row shown before saving
- Receptions with lots: invoice in USD or FC, carton scanning, short-expiry warning, draft, validate and send to the counter
- Daily exchange rate
- Stock screen: products with their lots, status (out, low, expiring) and selling order (FEFO)
- Alerts and dashboard

### Stock operations (Phase 3)

- Customer and supplier returns
- Adjustments with a reason and the pharmacist's PIN
- Remove an expired lot in one action
- Inventory count with corrections posted automatically
- Discrepancy list for offline oversells; receipt printing at the counter

### Reports (Phase 4)

- Stock status, expired, expiring soon, inventory, purchases
- Sales by day, cashier, payment method and currency; monthly consumption; most used medicines
- PDF and Excel export

### Manager mobile app

- Today: synced sales, sales waiting to sync, cash vs mobile money, status of each device (counter tablet, back-room tablet, laptop), top sellers
- Alerts by type, with **Prepare a supplier order**
- Product sheet: stock, minimum, price, 7-day sales, lots in selling order; change the price, adjust stock
- Quick sale from the phone, working offline

## Scope

### In scope

- Back-office web app, laid out for the back-room tablet and the laptop, in French
- Server database and API, the single source of truth
- Manager mobile app (Android) — **not yet in the weekly plan below; about 3 more weeks**
- Supplier order list prepared from alerts, to send to the supplier by hand

### Out of scope

- The counter sales app (separate Phase 2 plan)
- Patient records and insurance billing
- Ordering directly from supplier systems
- More than one branch or more than one counter
- Accounting (ledgers, tax returns)

## Success criteria

1. The client's real stock is imported and a sample of shelves matches the system.
2. A 10-line delivery entered on the back-room tablet reaches the counter after sync, with its lots and prices.
3. An expired lot cannot be sold and is removed from stock in one action.
4. A full inventory count closes with every difference posted as a correction.
5. The manager sees today's sales, pending syncs and alerts on the phone.
6. The pharmacist exports last month's sales and consumption reports without help.

## Timeline

&#91;embedded content: programme roadmap · 4 phases, 4 gates\]

Each phase ends at a gate the client signs off; the counter goes live at the end of week 11, and Phases 3 and 4 then run on live data.

## Phase 1 — Back-office web app (weeks 1–5)

At the end of Phase 1 the pharmacist logs in, loads the real stock from Excel, receives deliveries into lots and sees alerts and the dashboard. This is the data the counter app needs before it can sell.

| Week | Work | Done when |
| --- | --- | --- |
| 1 | Laravel 11 + Inertia/React project, MySQL migrations from the schema, login and roles (admin, pharmacist, cashier), settings, daily USD→CDF rate | Pharmacist logs in and saves today's rate |
| 2 | Suppliers and medicines: list, search, create, edit; units per pack, pack and unit prices, minimum stock | 20 test medicines entered with pack and unit prices |
| 3 | Opening-stock import from Excel/CSV: template, row validation, error preview, import as lots with `opening_stock` movements | Client's stock file imports, with every bad row listed before anything is saved |
| 4 | Receptions: delivery header and lines (lot, expiry, packs, purchase price), pack-to-unit conversion, stock movement service, lot history page | A 10-line delivery updates stock and appears in each lot's history |
| 5 | Alerts (out of stock, low, expiring within 90 days, expired), dashboard tiles, deployment to DigitalOcean (Nginx, PHP-FPM, Certbot, daily database backup), pilot with the pharmacist | Client signs off Phase 1 on the live server |

**Acceptance**

- [ ] Real opening stock imported and checked against a sample of shelves
- [ ] Dashboard stock value matches the import file total
- [ ] Every stock change shows as a movement with user and time
- [ ] Daily backup runs and one restore has been tested

The sync API for the tablet is built in Phase 2, not here.

## Phase 3 — Stock operations (weeks 12–14)

Phase 3 covers every stock change other than sales and deliveries, so the system's figures stay equal to the shelves once the counter is live.

| Week | Work | Done when |
| --- | --- | --- |
| 12 | Customer returns from the original receipt (back to the same lot, or written off if opened or expired), supplier returns, adjustments with reason and pharmacist PIN | Each case leaves a movement with reason and user |
| 13 | Expiry write-off from the expired list (one action per lot); inventory count: count sheet per lot, counted quantities entered, differences posted as corrections | A count of 30 lots closes with its corrections posted |
| 14 | Discrepancy list for offline oversells, on-demand Bluetooth receipt printing in the counter app, fixes from client testing | Counter prints a receipt; open discrepancies can be resolved |

**Acceptance**

- [ ] First full inventory count done after closing, with every difference explained
- [ ] Expired lots written off; dashboard shows zero expired stock
- [ ] Receipt printed on the client's own printer model

Receipt printing changes the counter app, so it ships as a counter app update at the end of week 14.

## Phase 4 — Reports (weeks 15–16)

Phase 4 delivers the eight reports from the design, each filtered by period and exported to PDF and Excel, then hands the system over.

| Week | Work | Done when |
| --- | --- | --- |
| 15 | Stock status, expired medicines, expiring soon, inventory, purchases by supplier | Figures match the dashboard and the lot pages |
| 16 | Sales (by day, cashier, payment method, currency), monthly consumption, most used medicines; PDF and Excel export; training and handover | Pharmacist exports last month's sales and consumption unaided |

**Acceptance**

- [ ] Sales report total equals the sum of receipts for a sample day
- [ ] Sales in CDF show the exchange rate used on each sale
- [ ] Pharmacist trained and given a short user guide

## Dependencies, risks and client inputs

Phase 3 starts only after the counter goes live in week 11, because returns and printing build on real counter sales. Phase 4 needs about a month of live data to check the reports against.

| Risk | Effect | Response |
| --- | --- | --- |
| Stock file arrives late or messy | Phase 1 runs past week 5 | Send the import template in week 1; the import can run any time before go-live |
| Client reviews slowly | Sign-offs wait | Book a 2-day review at the end of each phase |
| New scope mid-phase (prescriptions, insurance, a second counter) | Dates move | Log it for a later phase; v1 stays as designed |
| One developer, other client work in parallel | The plan has no slack | Add one buffer week per phase if other projects run at the same time; weekly demo on the live server |

**Needed from the client**

- [ ] Agreed start date
- [ ] Current stock list in Excel, with lot numbers and expiry dates
- [ ] Supplier list
- [ ] Domain name for the back office
- [ ] Receipt printer model (needed by week 12)
