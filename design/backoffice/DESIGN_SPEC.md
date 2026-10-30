# Pharmacy back office: design spec (Next.js)

The web back office for an offline-first pharmacy system in the DRC. The pharmacist uses it on the back-office laptop and tablet to manage medicines, stock, deliveries, corrections and reports. It is always online. Its server database is the source of truth that the counter tablet syncs with.

There are ten screens in three phases:

| # | Screen | Phase | Screenshot |
| --- | --- | --- | --- |
| 1 | Tableau de bord (dashboard) | 1 | `screens/01-Dashboard.png` |
| 2 | Médicaments (medicine list) | 1 | `screens/02-Medicaments.png` |
| 3 | Fiche médicament (medicine form) | 1 | `screens/03-Medicament-Form.png` |
| 4 | Import du stock initial (opening-stock import) | 1 | `screens/04-Import.png` |
| 5 | Nouvelle réception (receiving a delivery) | 1 | `screens/05-Reception.png` |
| 6 | Inventaire (stock count) | 3 | `screens/06-Inventaire.png` |
| 7 | Retours (returns) | 3 | `screens/07-Retours.png` |
| 8 | Ajustements & péremptions (adjustments and expiry) | 3 | `screens/08-Ajustements.png` |
| 9 | Rapport des ventes (sales report) | 4 | `screens/09-Rapport-Ventes.png` |
| 10 | Consommation & péremptions (consumption and expiry report) | 4 | `screens/10-Consommation.png` |

**Supporting files:**
- **Screenshots** are 1440 px wide at 2×, full page. They are the source of truth for layout. `*.mobile.png` shows how screens 1, 2 and 5 reflow at phone width (390 px).
- **Design source:** `source/*.dc.html`, the HTML the screenshots were rendered from. Read it for exact sizes, spacing and colours; don't port its markup. Its `{{…}}` holes and `<sc-for>` loops show which parts are data.
- **Tokens:** `tokens.css`. Use it for every colour, font, radius and shadow.

**Conventions:**
- **Language:** all UI text is French, exactly as in the screenshots.
- **Currency:** Congolese franc shown as `1 000 FC` (space as the thousands separator, no decimals). USD is shown as `367,55 USD` (comma decimal). Large values may be abbreviated on tiles: `41,6 M`. The daily USD→FC rate is shown in the dashboard header.
- **Dates:** `23/10/2026`; months as `11/2026`.
- **Sample data:** names, quantities and prices are placeholders. Put them in `lib/mock/*.ts` with TypeScript types, so the API can replace them later. `[NOM DE LA PHARMACIE]`, `[GROSSISTE A]` and `[FOURNISSEUR / GROSSISTE]` are placeholders filled from data.

## Global layout and components

**App shell** (shared by every screen), in `app/(backoffice)/layout.tsx`:

- **Sidebar:** dark (`sidebar`), flex-basis 240 px, padding 20 × 14.
  - **Top:** a 32 × 32 primary square with a white + (the logo mark), the pharmacy name (white, bold 14) and "Back-office" (12, `sidebar-label`).
  - **Groups:** an unlabelled first item, then labelled groups with uppercase 11 px bold labels (letter-spacing 0.08em).
    - (no label): Tableau de bord
    - **STOCK:** Médicaments, Réceptions, Import du stock, Inventaire, Retours, Ajustements
    - **RAPPORTS:** Ventes, Consommation
    - **SYSTÈME:** Paramètres, Synchronisation
  - **Items:** min-height 40, radius 10, 14 px medium, colour `sidebar-item`. The active item has a `sidebar-active` background and white text, set from the current route.
- **Main column:**
  - **Page header:** white, 1 px bottom border, padding 20 × 32. Title (h1, 22 bold) with a 13 px muted subtitle on the left, page actions on the right. It wraps on narrow screens.
  - **Content:** padding 24 × 32 × 40, sections separated by 20.
- **Responsive:** the sidebar and main column are a wrapping flex row (sidebar `flex: 1 1 240px`, main `flex: 999 1 560px`), so the sidebar stacks above the content on narrow screens. Tables keep a minimum width and scroll sideways inside their card (`overflow-x: auto`); the page itself never scrolls sideways.

**Shared components** to build first (in `components/ui/`):

| Component | Spec |
| --- | --- |
| `Card` | White, radius 16, `shadow-card`, no border. Section title h2 17 bold. |
| `Button` | Height 44, radius 12, 14 px. **Primary:** `primary` background, white bold. **Secondary:** white, 1 px `border-strong`, ink semibold. **Danger:** `danger` background, white (lot removal). **Danger-soft:** `danger-soft` background, `danger` text. Large variant: height 48, 15 px. |
| `FilterChips` | Height 44 (36 in compact card headers), radius 12 (9 compact), 13 px semibold. Selected: `ink` background, white text. Others: transparent, `ink-muted`. Labels may include a count ("Écarts seulement · 9"). |
| `SearchInput` | Height 44, radius 12, white, `shadow-card`, search icon. |
| `Field` | Label 13 px muted above the input (6 gap). Input/select height 44 (48 on the reception form), 1.5 px `border-strong`, radius 10, 15 px. Numeric fields use the mono font. |
| `Badge` | Inline, 12 px bold, padding 4 × 8, radius 6, soft background + dark text: OK (primary-soft), Stock bas / Expire bientôt (warning-soft), Rupture / Expiré (danger-soft). |
| `StatTile` | Radius 16, padding 16 × 18, min-height ~108: label 13 semibold, value mono 26–28, sub 12. Variants: plain (white + shadow), warning-soft, danger-soft, primary-soft. Tiles may be links. |
| `DataTable` | CSS grid columns (see each screen). Header row: 12 px uppercase semibold, `ink-muted`, letter-spacing 0.04em, dividers above and below. Rows: min-height 52–60, 1 px `divider` between rows, 14 px. Numbers right-aligned in mono. Cells can hold two lines (main + 12 px muted detail). |
| `Pagination` | "1–10 sur 412" on the left; Précédent / Suivant (height 40, radius 10) on the right. |
| `Stepper` | Numbered pills, height 44: done (primary-soft with a ✓ in a primary circle), current (ink with a white number circle), next (white, muted). |

**Typography:** IBM Plex Sans for text. IBM Plex Mono for every number, price, quantity, lot code, invoice number and column in Excel files (`date_expiration`).

**Icons:** simple 2 px stroke icons (lucide-react). No emoji.

## Suggested routes (App Router)

| Route | Screen |
| --- | --- |
| `/` → redirect to `/tableau-de-bord` | |
| `/tableau-de-bord` | 1 |
| `/medicaments` | 2 |
| `/medicaments/nouveau`, `/medicaments/[id]` | 3 |
| `/import` | 4 |
| `/receptions/nouvelle` | 5 |
| `/inventaire` | 6 |
| `/retours` | 7 |
| `/ajustements` | 8 |
| `/rapports/ventes` | 9 |
| `/rapports/consommation` | 10 |

Use English slugs instead if the codebase already does; keep the French labels in the UI.

## 1. Tableau de bord (dashboard)

- **Header:**
  - Left: title, plus the date as the subtitle ("Vendredi 23 octobre 2026").
  - Right: a "Taux du jour" pill (`background`, height 40, radius 10) showing `1 USD = 2 800 FC` in mono. It links to settings to change the rate.
  - Far right: the user avatar (36 px circle, primary-soft, initials), name and role ("Pharmacien").
- **Tile row** (auto-fit grid, min 150 px, gap 14). Each tile links to the relevant list:
  - Ventes du jour (plain): `1 284 500`, sub "FC · 58 tickets"
  - Valeur du stock (plain): `41,6 M`, sub "FC · prix d'achat"
  - Ruptures (danger): `3`, sub "médicaments à 0"
  - Stock bas (warning): `11`, sub "sous le seuil"
  - Expire < 90 jours (warning): `7`, sub "lots"
  - Expirés (danger): `2`, sub "lots à retirer"
- **Two columns** (wrap below ~900 px):
  - **"À traiter" card** (flex 2): compact filter chips Tout · 21 / Ruptures / Stock bas / Péremptions.
    - Table columns: Médicament (name + detail) | Stock | Seuil | Alerte (badge) | action link (Commander → receiving; Voir le lot / Retirer → adjustments).
    - Footer link "Voir les 21 alertes".
  - **Right column** (flex 1):
    - **"Dernières réceptions" card:** the last 3 deliveries (ref, supplier, line count, date) and a full-width primary "Nouvelle réception" button.
    - **"Appareils" card:** one row per device with a 10 px status dot (green online / amber offline), name and status text (e.g. "Hors ligne depuis 09:15 · 12 ventes en attente").

## 2. Médicaments (medicine list)

- **Header:** subtitle "412 médicaments · prix synchronisés avec la caisse". Actions: secondary "Importer (Excel)" (→ /import) and primary "+ Nouveau médicament".
- **Toolbar:** search ("Nom, molécule ou code-barres"), a Catégorie select, and filter chips Tous / Ruptures / Stock bas / Ordonnance.
- **Table** (min-width 900, scrolls in its card). Columns: `2.2fr | 130 | 90 | 110 | 100 | 140 | 120 | 70`:
  - Médicament: name (semibold) + "Rx" in `rx` blue when a prescription is required; form below.
  - Catégorie (muted).
  - Unités / bte (units per box).
  - Prix boîte (box price): `7 500 FC`.
  - Prix unité (unit price): `350 FC`, or "—" when the medicine isn't sold by the unit.
  - Stock: `144 u · 6 bt` with "seuil 720" below.
  - Statut badge.
  - "Modifier" link.
- **Footer:** pagination.
- **Stock unit:** stock is counted in units (tablets, capsules…); boxes are derived from it.

## 3. Fiche médicament (medicine form)

- **Header:** a back link "← Médicaments" above the title (the medicine name, or "Nouveau médicament"). Actions: secondary Annuler, primary Enregistrer.
- **Left column (flex 2), two cards:**
  - **Identification:** auto-fit grid (min 220). Fields:
    - Nom commercial (trade name)
    - Molécule (DCI) (active ingredient)
    - Forme (form): Gélule, Comprimé, Sirop, Injectable…
    - Dosage
    - Catégorie
    - Code-barres (barcode, optional, mono)
    - Below the grid, a checkbox **"Sur ordonnance"** (prescription only) with the help text "La caisse demandera le prescripteur à la vente" (the till will ask for the prescriber).
  - **Conditionnement et prix de vente** (packaging and selling price): auto-fit grid (min 180). Fields:
    - Unités par boîte (units per box)
    - Prix de la boîte (FC) (box price)
    - Prix à l'unité (FC) (unit price)
    - Seuil minimum (unités) (minimum stock)
    - Then a checkbox **"Vendre aussi à l'unité (plaquette ouverte)"** (also sell by the unit). Unchecking it disables and clears the unit price.
    - An info strip below: the box price in USD at today's rate, and the margin on the latest lot.
- **Right column (flex 1): "Lots en stock" card.** Total units in mono at the top right, then "Vendus dans cet ordre (premier expiré, premier sorti)" (sold in this order: first expired, first out). One bordered card per lot: code and quantity, expiry date and purchase cost per box. Link "Historique des mouvements" (movement history).

## 4. Import du stock initial (opening-stock import)

An import wizard. The screen shows step 3.

- **Header:** subtitle "Rien n'est enregistré tant que vous n'avez pas confirmé" (nothing is saved until you confirm). Action: secondary "Télécharger le modèle Excel" (download the template).
- **Stepper:** 1 Modèle ✓, 2 Fichier chargé ✓, **3 Vérification** (current), 4 Import.
- **Summary row:**
  - A file card (Excel icon, file name, "412 lignes · chargé à 09:12", secondary "Changer de fichier").
  - Tile "Lignes valides 398" (primary-soft) and tile "Lignes en erreur 14" (danger-soft).
- **"Erreurs à corriger" card:** link "Télécharger la liste (Excel)".
  - Table: Ligne (mono) | Médicament | Colonne (mono, the Excel column name) | Problème (in `danger`).
  - Examples: empty expiry date, a date in the past, text instead of a number, units per box = 0, a negative quantity, a duplicate lot.
  - Footer: "+ 8 autres erreurs dans le fichier téléchargeable".
- **Bottom bar:** explanation text, secondary "Recharger le fichier corrigé", primary "Importer les 398 lignes valides".
- **Validation runs on the server; nothing is written until confirmed.** Each valid row becomes a lot with an `opening_stock` movement.

## 5. Nouvelle réception (receiving a delivery)

- **Header:** subtitle "Brouillon enregistré à 09:40" (draft autosave time). Actions: secondary "Enregistrer le brouillon", primary "Valider la réception".
- **Delivery card:** 4 fields in an auto-fit grid: Fournisseur (supplier select), N° bon de livraison / facture, Date de réception, Devise de la facture (USD / FC).
- **Lines card (flex 3).** Table min-width 860, columns: Médicament (name + pack size) | N° de lot | Expiration | Boîtes | Unités (calculated, muted) | Achat / bte | Total | remove ×.
  - **Short-dated lines** (expiring in under 6 months) have a `warning-row` background and an amber bold expiry date.
  - **Entry row** at the bottom (`row-tint` background): inputs 40 tall. The medicine input has a primary border and opens a search. Enter adds the line.
  - **Help text:** "Entrée pour ajouter la ligne · les unités sont calculées depuis la fiche du médicament" (press Enter to add the line; units are calculated from the medicine record).
- **Summary column (flex 1):**
  - **"Récapitulatif" card:** Lignes 5, Boîtes 93, Unités en stock + 1 244, then "Total facture 367,55 USD" (mono 22) with "≈ 1 029 140 FC au taux du jour" below it.
  - **Amber warning card:** "1 lot à date courte" (1 short-dated lot), naming the lot.
- **Layout fix (differs from the screenshot):** at 1440 px the summary column squeezes the table, so its last columns scroll out of view. **Put the summary below the table whenever the content area is narrower than ~1100 px** (container query or breakpoint), so all columns stay visible.
- **On validation:** the server creates one lot per line and its stock movements, all in one transaction. The counter tablet picks up the new lots and prices on its next sync. Reject past expiry dates, and ask for confirmation for expiries under 6 months.

## 6. Inventaire (stock count)

- **Header:** "Inventaire · octobre 2026". Subtitle "Ouvert le 23/10 à 07:30 · ventes bloquées sur les produits en cours de comptage" (sales are blocked on products being counted). Action: secondary "Imprimer la feuille de comptage" (print the count sheet).
- **Summary row:**
  - Progress card: "Avancement 214 / 412 lots", a 10 px progress bar and "Rayons A à D comptés · E et F restants" (shelves A–D counted, E and F left).
  - Tile "Lots avec écart 9" (lots with a difference).
  - Tile "Valeur des écarts − 58 200 FC" (danger).
- **Toolbar:** search ("Médicament, lot ou rayon") and chips Tous / Écarts seulement · 9 / Non comptés · 198.
- **Table** (min-width 860): Médicament (name + expiry) | Lot | Rayon (shelf) | Système (system qty) | Compté (counted: an input 96 × 40, mono, right-aligned) | Écart (difference) | Valeur (value).
  - Écart formatting:
    - Negative: `−10` in `danger` bold.
    - Positive: `+12` in `info` bold.
    - Zero: `0` in `on-primary-soft`.
    - Not counted: "à compter" in `ink-faint`.
  - The value is the difference × purchase price, as "− 1 000 FC".
- **Bottom bar:** explanation ("À la clôture, chaque écart devient un ajustement signé à votre nom…": on closing, each difference becomes an adjustment signed in your name). Secondary "Voir la liste des écarts", primary "Clôturer l'inventaire" (close the count).

## 7. Retours (returns)

- **Header:** a segmented tab control (padded 4 px track in `background`, tabs 40 tall). Selected "Retour client" is white with a small shadow, bold; the other tab is "Retour fournisseur".
- **Left (flex 2):**
  - **Ticket lookup card:** "N° du ticket d'origine" field (mono), with the sale details next to it ("Vendu le 21/10/2026 à 15:02 · Caisse 1 · 12 500 FC en espèces").
  - **"Articles du ticket" card:**
    - Table columns: checkbox (22 px) | Article (name + lot) | Vendu | À retourner (input 90 × 40) | Montant.
    - Below it: Motif (reason select) and a radio group "Que faire du produit ?": "Remettre en stock (emballage intact)" (back into stock, packaging intact) or "Mettre au rebut" (dispose).
- **Right (flex 1):**
  - **"Remboursement" card** (refund): number of items, method, "À rembourser 7 500 FC" (mono 24), a full-width primary "Valider le retour" and the note "Un reçu de retour est imprimé pour le client" (a return receipt is printed for the customer).
  - **"Retours récents" card:** the last 3 returns.
- **Supplier tab:** same structure, but it starts from a delivery reference and has no refund card.

## 8. Ajustements & péremptions (adjustments and expiry)

- **Left (flex 2):**
  - **"Lots expirés et à date courte" card**, with "Alerte à 90 jours" on the right.
    - Table columns: Médicament (name + value/detail) | Lot | Expiration (badge: danger "Expiré 15/10", warning "30/11/2026") | Qté | action.
    - Actions: expired lots get a red "Retirer du stock" button (height 40); expiring lots get a secondary "Promouvoir" (promote).
  - **"Journal des ajustements" card** (adjustment log): Date | Médicament · lot + reason | Type | Qté (+ in `info`, − in `danger`) | user.
- **Right (flex 1): "Nouvel ajustement" form.** Fields in order:
  - Médicament
  - Lot (select showing qty and expiry)
  - Type: a 2 × 2 option grid of 44-tall buttons, Casse / Perte / vol / Péremption / Correction (breakage, loss/theft, expiry, correction). Selected: 2 px primary border on `primary-soft`.
  - Quantité (unités, − pour retirer) (units, negative to remove)
  - Motif (obligatoire) (reason, required textarea)
  - A strip "Stock après ajustement : 402 u" (stock after adjustment)
  - Primary "Enregistrer l'ajustement"
- **Rule:** every stock change outside sales and receiving goes through here and is stored as a movement with type, reason, user and time. Nothing edits quantities directly.

## 9. Rapport des ventes (sales report)

- **Header:** subtitle "Inclut les ventes synchronisées jusqu'à 10:41" (includes sales synced up to 10:41). Actions: a period select ("1–23 octobre 2026"), secondary "Exporter Excel", primary "Exporter PDF".
- **KPI row** (auto-fit, min 200):
  - Chiffre d'affaires (revenue) `27 085 000 FC`, sub "≈ 9 673 USD"
  - Tickets `1 264`, sub "55 par jour en moyenne"
  - Panier moyen (average ticket) `21 428 FC`
  - Mobile money `35 %`, sub "du chiffre d'affaires"
  - **Calculate these from data; never hard-code them.**
- **"Ventes par jour (FC)" card:** a stacked bar chart, one bar per day.
  - Cash (`primary`) at the bottom, mobile money (`mobile-money`) on top. Legend with square swatches. Y axis 0–1,6 M with light gridlines; day numbers below.
  - Use Recharts, or plain divs as in the design. Add tooltips with exact values.
  - Give the chart an aria-label summary.
- **"Meilleures ventes de la période" card** (best sellers): # | Médicament | Quantité | Chiffre d'affaires | Part du CA (a share bar, 8 tall, primary on `divider`, plus the percentage in mono). Sorted by revenue.

## 10. Consommation & péremptions (consumption and expiry)

- **Header:** subtitle "6 derniers mois · sert à préparer les commandes" (last 6 months · used to prepare orders). Actions: secondary "Exporter Excel", primary "Bon de commande suggéré" (suggested order).
- **Left (flex 3): "Consommation mensuelle" card**, with the note "Couverture = stock ÷ moyenne mensuelle" (cover = stock ÷ monthly average).
  - Table min-width 820, columns: Médicament (+ unit) | Mai → oct. (sparkline: 6 bars ~30 tall, the last month in `primary`, the others `primary-tint`) | Moy. / mois | Stock | Couverture (mono badge) | À commander.
  - Couverture badge: under 0,5 mois danger-soft, under 1 mois warning-soft, otherwise primary-soft.
  - Footnote: "« À commander » vise 2 mois de couverture, arrondi à la boîte." (the order quantity targets 2 months of cover, rounded to the box).
  - **Formulas:** `avg = mean(last 6 months)`; `cover = stock / avg`; `order = max(0, ceil(avg × 2 − stock))`, rounded up to whole boxes.
- **Right (flex 1):**
  - **"Valeur qui expire" card** (value expiring): one row per month showing the value at purchase price, a bar (8 tall: `danger` for already expired, `warning-dot` for future months) and the lot detail. Link "Gérer les lots" → adjustments.
  - **"Autres rapports" card** (other reports): rows 44 tall on `background`, each with the report name and "PDF · Excel" on the right: État du stock, Achats par fournisseur, Inventaires clôturés, Mouvements par lot, Produits les plus utilisés.

## Behaviour notes

- **Online only:** the back office is always online. Use server components for lists and reports, and client components only for interactive parts (filters, forms, chart tooltips).
- **Lots:** every lot has a lot code, an expiry date and a purchase price. Sales use the lot that expires first (first-expired, first-out).
- **Stock movements:** every stock change is a movement (opening_stock, reception, sale, return, adjustment, inventory, expiry) with the user and time. Stock levels are derived from movements.
- **Loading and empty states** aren't designed. Use skeletons in the card style and short muted messages, e.g. "Aucune alerte" or "Aucun retour récent".
