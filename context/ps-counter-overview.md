# Pharmacy System — Project Plan: Phase 2 Counter App

Oct 23, 2026 · @Demto

Phase 2 builds the sales-only counter app and the sync API in 6 weeks (weeks 6–11) and ends with go-live at the counter. It starts once Phase 1 is live, because the tablet needs real medicines, lots and prices to sell.

## Overview

The counter app is the only screen the cashier uses: an Android tablet app that finds medicines, sells and takes payment, with or without internet. It holds its own copy of the medicines, lots and prices, picks the earliest-expiring lot automatically and sends sales to the server whenever a connection is available. It solves slow, error-prone selling by hand and the sales lost or left unrecorded during power and internet cuts.

## Goals

1. Every sale completes offline: no sale is ever blocked by an internet or power cut.
2. A typical 3-item sale, payment included, takes under 60 seconds.
3. No sale lost or counted twice: every sale reaches the back office exactly once.
4. No expired medicine sold, and every sale uses the earliest-expiring lot first (FEFO).
5. Correct totals and change in CDF or USD at the day's rate.

## Core user flow

1. The cashier opens the till with their username and PIN; this works offline.
2. They search by name, DCI or barcode (or scan), or browse by category: malaria, antibiotics, pain, children, vitamins.
3. They add products; the cart shows the lot and expiry being sold, and prescription items are flagged.
4. For each line they choose box or unit. Selling by the unit opens a box, and that opened box is sold first next time.
5. If needed they put the sale on hold to serve another customer.
6. They tap **Encaisser** and choose cash (FC or USD), M-Pesa, Orange Money or Airtel Money, then enter the amount received; the app shows the change.
7. For prescription items they enter the prescriber and, optionally, the patient's name.
8. They validate the payment and print a receipt if the customer wants one. The sale joins the sync queue; the header shows when the till is offline and how many sales are waiting.

## Features

### Selling

- Search or scan, category filters, product grid with price, prescription flag and "few left" warning
- Cart with quantity, Box / Unit switch, lot and expiry per line, remove a line
- Unit-sale screen with keypad and quick quantities, showing how many units the opened box will have left
- Hold a sale; attach a customer

### Payment

- Cash in FC or USD at the day's rate, quick amounts, change calculated
- Mobile money: M-Pesa, Orange Money, Airtel Money, with the transaction reference typed in
- Prescriber and patient name for prescription items
- Receipt printing on request (Bluetooth printer, delivered in Phase 3)

### Offline and sync

- Local copy of medicines, lots, prices, cashiers and the day's rate
- Offline indicator with the number of sales waiting to sync
- Sales pushed up and catalogue pulled down automatically, plus a **Sync now** button
- Server sync API with duplicate protection and FEFO reallocation
- Tablet clock checked against the server

### Control

- Username + PIN login; the cashier cannot change prices, stock or medicines
- Ticket numbers per till (C1-0458)
- Today's sales for the cashier's cash-up

## Scope

### In scope

- Counter tablet app (Android), in French
- Server sync API
- Prescriber recorded on prescription sales

### Out of scope

- Back office, stock operations and reports (Phases 1, 3 and 4)
- Manager mobile app, including its quick sale (it will reuse this phase's sale engine)
- Mobile money API integration: references are typed in by hand
- Patient records and insurance
- Returns at the counter (done in the back office, Phase 3)

## Success criteria

1. A cashier logs in and completes a sale with the WiFi switched off.
2. A 3-item sale with payment and change takes under 60 seconds.
3. A sale needing two lots uses the earliest-expiring lot first; expired lots never appear.
4. Selling 12 tablets from a box of 24 leaves 12 in the opened box, and those are sold first next time.
5. After a full day offline, every sale reaches the back office once and the totals match.
6. A power cut during payment leaves the sale either fully saved or absent.

## Prerequisites (before week 6)

- [ ] Phase 1 live, with the real stock imported
- [ ] Counter tablet bought: Android, 10-inch, at least 4 GB RAM recommended
- [ ] Expo/EAS account set up for Android builds

## Weekly plan (weeks 6–11)

The server API comes first so the app is built against real data from day one; checkout and sync get a full week each because they carry the money and the stock.

| Week | Work | Done when |
| --- | --- | --- |
| 6 | Sync API on the server: device registration and token, pull endpoint with cursors, push endpoint with event log and de-duplication, server FEFO reallocation and discrepancy creation | API tests pass for pull, push, and the same push sent twice |
| 7 | App shell: Expo project, SQLite schema, first-run registration, full download, cashier PIN login | A fresh tablet downloads the catalogue and logs a cashier in offline |
| 8 | Search and cart: FTS search, box/unit toggle (hidden when a medicine is not sold by unit), prices, stock as boxes + units, near-expiry flag | Any medicine found in under a second among 1,000+ items |
| 9 | Checkout: FEFO allocation in one transaction, totals in CDF and USD at the day's rate, change, mobile money reference, receipt number, outbox entry | 50 test sales leave stock and outbox consistent, including after a forced power-off |
| 10 | Sync loop: push on reconnect and "Sync now", pull after each upload and every few minutes, clock check, today's sales screen | A full day of offline sales syncs once, with no duplicates |
| 11 | Field test in the pharmacy, fixes, release build (APK), cashier training, go-live | The cashier sells for a full day and the back-office figures match |

## Sync API (server side)

Three endpoints are enough, all behind the device's Sanctum token except registration.

| Endpoint | Direction | What it does |
| --- | --- | --- |
| `POST /api/device/register` | Setup | Pharmacist links the tablet with their login; returns the device token |
| `GET /api/sync/pull?cursor=` | Down | Medicines, lots with current quantities, cashiers, settings and the day's rate changed since the cursor; also returns the server time for the clock check |
| `POST /api/sync/push` | Up | A batch of `sale_created` events; each event id is applied once (logged in `sync_events`), shortfalls are moved to the next FEFO lot or logged as discrepancies |

The push response returns the corrected lot quantities, so the tablet is up to date without waiting for the next pull.

## Testing and go-live

Go-live waits until every offline test below passes on the actual counter tablet.

**Offline tests**

- [ ] Sale made with WiFi off, then synced: appears exactly once in the back office
- [ ] Power cut during checkout: the sale is either fully saved or absent
- [ ] Sale needing two lots: the earliest-expiring lot is used first
- [ ] Expired lot is never offered at the counter
- [ ] Wrong tablet date: sales blocked with a warning
- [ ] Delivery received in the back office reaches the tablet after reconnecting
- [ ] Same push sent twice: stock deducted once
- [ ] Payment in CDF: correct total and change at the day's rate

**Go-live day**

1. Final stock check in the back office; the tablet does a full download.
2. Pharmacist enters the day's exchange rate.
3. Cashier logs in with their PIN and makes the first real sale while the developer watches.
4. Developer on site for the first day; sync checked at closing time.

## Risks and open questions

| Risk | Effect | Response |
| --- | --- | --- |
| Low-end tablet | Slow search or checkout | Test on the actual tablet from week 7, not only an emulator |
| Internet at the counter is unreliable | Sync delayed for hours | Expected by design; sync at closing time every day |
| Cashier mixes up box and unit | Wrong stock and price | Clear Box / Unit toggle, unit price shown in the cart, toggle hidden for medicines not sold by unit |
| Field test finds real-world problems | Go-live slips | Week 11 is reserved for fixes; go-live moves rather than shipping with a failed offline test |

**Open questions for the client**

- [ ] Which tablet model will be used at the counter?
- [ ] Shop WiFi or a mobile data SIM for the tablet?
- [ ] Is the receipt number format C1-YYYYMMDD-0001 acceptable?
