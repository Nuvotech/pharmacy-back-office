# design.md: Admin dashboard design system

A complete spec for building admin dashboards in a clean "slate and blue" style: dark slate sidebar, white top bar, light grey canvas, white cards, one strong blue accent, and quiet green/red trend badges.

The values below were measured from four reference screens (a project detail page, a sales dashboard, and an analytics dashboard at two sizes). All measurements are CSS pixels at a 1600 px wide viewport. Colours map one-to-one onto the default Tailwind CSS palette, so every value is given both as a Tailwind class and as a hex code.

**How to use this file:** put it in the root of a project (or in `docs/`) and tell your coding assistant: *"Build the dashboard following design.md exactly. Use its tokens, components and page templates; don't invent new colours, sizes or components."*

---

## 1. Design principles

1. **One accent colour.** Blue-600 is the only strong colour. It marks primary buttons, the active tab, links, chart data and progress. Everything else is slate grey on white.
2. **Colour means something.** Green is only for "up / good / done" and red only for "down / bad". Never use them for decoration.
3. **Flat cards on a tinted canvas.** The page is slate-100; content sits on white cards with a barely visible shadow and a 4 px radius. There are no heavy borders and no gradients except the soft icon tiles.
4. **Quiet labels, loud numbers.** Labels are small, uppercase, letter-spaced and grey; values are large, semibold and near-black.
5. **Generous, regular spacing.** Everything sits on a 4 px grid. The page gutter is 48 px, the gaps between cards 24 px, and the inner card padding 24 px.
6. **Dense but calm.** Show a lot of data (KPIs, charts, tables, lists) in a strict grid of equal-height cards. Leave whitespace instead of adding dividers.

---

## 2. Colour tokens

### 2.1 Core palette

| Token | Tailwind | Hex | Used for |
| --- | --- | --- | --- |
| `--sidebar-bg` | `slate-800` | `#1E293B` | Sidebar background |
| `--sidebar-brand-bg` | `slate-900` | `#0F172A` | Logo bar at the top of the sidebar |
| `--sidebar-text` | `slate-400` | `#94A3B8` | Sidebar items, chevrons, collapse icon |
| `--sidebar-label` | `slate-500` | `#64748B` | Sidebar section labels (PAGES, CUSTOMIZE), sub-item bullets |
| `--sidebar-text-active` | `white` | `#FFFFFF` | Active and hovered sidebar item text, logo text |
| `--sidebar-icon-active` | `blue-500` | `#3B82F6` | Icon of the active sidebar item |
| `--canvas` | `slate-100` | `#F1F5F9` | Page background, page-header band, top-nav active pill, secondary button |
| `--surface` | `white` | `#FFFFFF` | Top bar, cards |
| `--surface-muted` | `slate-50` | `#F8FAFC` | Table header row |
| `--border` | `slate-200` | `#E2E8F0` | Top-bar bottom border, page-header bottom border, card header divider, tab bar divider |
| `--grid-line` | `gray-200` | `#E5E7EB` | Chart gridlines, mini-ring track |
| `--text-strong` | `slate-900` | `#0F172A` | Page title, KPI values, card titles, names |
| `--text` | `slate-700` | `#334155` | Top-nav items, table numbers, breadcrumb current item, secondary button text |
| `--text-muted` | `slate-600` | `#475569` | KPI labels, table headers, "from last month", emails, descriptions, tabs |
| `--text-subtle` | `slate-500` | `#64748B` | Breadcrumb links, chart axis labels, icon buttons, meta icons, phone numbers |
| `--primary` | `blue-600` | `#2563EB` | Primary button, active tab, links, bars, sparklines, progress, checkbox |
| `--primary-hover` | `blue-700` | `#1D4ED8` | Primary button hover; darkest donut segment |
| `--primary-soft` | `blue-100` | `#DBEAFE` | Progress-bar track, icon tile background |
| `--primary-softer` | `blue-50` | `#EFF6FF` | Bottom of icon-tile gradient |
| `--chart-2` | `indigo-200` | `#C7D2FE` | Second series (light bars, third donut segment) |
| `--chart-3` | `indigo-100` | `#E0E7FF` | Fourth donut segment |

### 2.2 Status colours

| Token | Tailwind | Hex | Used for |
| --- | --- | --- | --- |
| `--success-bg` | `green-100` | `#DCFCE7` | Up-trend badge background |
| `--success-text` | `green-600` | `#16A34A` | Up-trend badge text and arrow |
| `--success-fill` | `green-400` | `#4ADE80` | Completed (100 %) progress bar |
| `--danger-bg` | `red-100` | `#FEE2E2` | Down-trend badge background |
| `--danger-text` | `red-600` | `#DC2626` | Down-trend badge text and arrow |
| `--neutral-fill` | `slate-400` | `#94A3B8` | Stale or inactive progress bar |

### 2.3 Icon-tile accent pairs

Square icon tiles use a pale background with a saturated icon of the same hue. Use them to tell list items apart (projects, deals, categories).

| Pair | Background | Icon |
| --- | --- | --- |
| Emerald | `emerald-100` `#D1FAE5` → `emerald-50` `#ECFDF5` (vertical gradient) | `emerald-500` `#10B981` |
| Blue | `blue-100` `#DBEAFE` → `blue-50` `#EFF6FF` | `blue-600` `#2563EB` |
| Cyan | `cyan-100` `#CFFAFE` | `cyan-500` `#06B6D4` |
| Purple | `purple-100` `#F3E8FF` | `purple-500` `#A855F7` |

### 2.4 CSS variables

```css
:root {
  --sidebar-bg: #1E293B;  --sidebar-brand-bg: #0F172A;
  --sidebar-text: #94A3B8; --sidebar-label: #64748B; --sidebar-icon-active: #3B82F6;
  --canvas: #F1F5F9; --surface: #FFFFFF; --surface-muted: #F8FAFC;
  --border: #E2E8F0; --grid-line: #E5E7EB;
  --text-strong: #0F172A; --text: #334155; --text-muted: #475569; --text-subtle: #64748B;
  --primary: #2563EB; --primary-hover: #1D4ED8; --primary-soft: #DBEAFE; --primary-softer: #EFF6FF;
  --chart-2: #C7D2FE; --chart-3: #E0E7FF;
  --success-bg: #DCFCE7; --success-text: #16A34A; --success-fill: #4ADE80;
  --danger-bg: #FEE2E2; --danger-text: #DC2626; --neutral-fill: #94A3B8;
  --radius: 4px; --radius-full: 9999px;
  --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --font-sans: "Poppins", ui-sans-serif, system-ui, sans-serif;
  /* Alternative: --font-sans: "Instrument Sans", ui-sans-serif, system-ui, sans-serif; */
}
```

---

## 3. Typography

**Typeface:** **Poppins** (Google Fonts), weights 400, 500 and 600. **Instrument Sans** (Google Fonts, same weights) is the approved alternative. Pick one per project and use it everywhere: UI text, charts and tables. Don't mix the two, and don't fall back to any other typeface.

| | Poppins | Instrument Sans |
| --- | --- | --- |
| Character | Geometric, round, friendly; wide letters | Neo-grotesque, slightly condensed, crisp |
| Best for | Spacious dashboards, client-facing admin panels | Dense tables and data-heavy screens |
| Size adjustment | Runs large and wide: keep the sizes below but use line-heights 2–4 px taller, and allow ~10 % more width for labels and buttons | Use the sizes below as they are |

The base size is 14 px. Use tabular figures (`font-variant-numeric: tabular-nums`) in tables, KPI values and phone numbers so columns line up. Check that the chosen font actually applies them; if the digits still shift, right-align numeric columns instead.

| Role | Size / line-height | Weight | Colour | Case / tracking | Example |
| --- | --- | --- | --- | --- | --- |
| Page title | 18 / 28 | 600 | `slate-900` | normal | "Dashboard" |
| Project / entity title | 18 / 28 | 500 | `slate-900` | normal | "Masterpiece E-commerce" |
| Card title | 16 / 24 | 500 | `slate-900` | normal | "Sales per month" |
| Section heading (on canvas) | 16 / 24 | 500 | `slate-900` | normal | "Monthly Analytics" |
| KPI value, large | 24 / 32 | 600 | `slate-900` | normal | "$372k" (sparkline cards) |
| KPI value, compact | 20 / 28 | 600 | `slate-900` | normal | "$59k" (badge cards, ring cards) |
| Body / list item | 14 / 20 | 400 | `slate-600`–`slate-700` | normal | "from last month", emails |
| Name / item title | 14 / 20 | 500 | `slate-900` | normal | "Courtney Herrera" |
| Navigation item | 14 / 20 | 400 (500 active) | see nav | normal | "Dashboard", "Pages" |
| KPI label | 12 / 16 | 600 | `slate-600` | UPPERCASE, `tracking-wider` (0.05em) | "TOTAL SALES" |
| Table header | 12 / 16 | 600 | `slate-600` | UPPERCASE, `tracking-widest` (0.1em) | "TEAM MEMBER" |
| List section label | 12 / 16 | 600 | `slate-600` | UPPERCASE, `tracking-wider` | "TODAY'S CALLS (2)" |
| Sidebar section label | 11 / 16 | 600 | `slate-500` | UPPERCASE, `tracking-widest` (0.1em) | "PAGES" |
| Badge | 12 / 16 | 600 | status text | normal, `tracking-wide` | "↑ 24%" |
| Small meta | 12 / 16 | 400 | `slate-500`–`slate-600` | normal | "from last month" in sparkline cards |
| Chart axis / legend | 12 / 16 | 400 | `slate-500` | normal | "800", "Jan", "Online" |

---

## 4. Spacing, grid and layout

### 4.1 Scale

Use a 4 px base: 4, 8, 12, 16, 20, 24, 32, 48. The values used most:

| Spacing | Value |
| --- | --- |
| Page side gutter (content to sidebar, content to right edge) | **48 px** (`px-12`) |
| Space between the page-header band and the first content row | **32 px** (`pt-8`) |
| Gap between cards, horizontally and vertically | **24 px** (`gap-6`) |
| Card padding | **24 px** (`p-6`) |
| Card header height | **56 px**, padding `0 24px` |
| Gap between label → value → meta in a KPI card | 12–16 px |

### 4.2 App shell

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ Logo bar 56  │ Top bar 70 (white, bottom border)              [avatar 40]   │
│ (slate-900)  ├──────────────────────────────────────────────────────────────┤
│              │ Page header 60 (slate-100, bottom border): Title | Breadcrumb │
│ Sidebar      ├──────────────────────────────────────────────────────────────┤
│ 256 wide     │  48 │ 32 top padding                                    │ 48 │
│ slate-800    │     │ ┌────┐ 24 ┌────┐ 24 ┌────┐ 24 ┌────┐   KPI row    │    │
│              │     │ └────┘    └────┘    └────┘    └────┘              │    │
│              │     │ 24                                                │    │
│              │     │ ┌──────────────────┐ 24 ┌─────────────┐  content  │    │
│              │     │ └──────────────────┘    └─────────────┘           │    │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

- **Sidebar:** fixed, full height, 256 px (`w-64`).
- **Main area:** `margin-left: 256px`. It holds the top bar, the page header and a content container (`px-12 pt-8 pb-12`) on the slate-100 canvas.
- **Content grid:** 12 columns, 24 px gap. The content width at 1600 px is 1248 px. The common splits are:
  - KPI row: 4 × 3 columns (or 3 × 4 columns).
  - Chart + side chart: 8 + 4 columns (the reference uses ≈ 739 + 485 px, which is 7 + 5; either works).
  - Two equal halves: 6 + 6 columns (analytics page left/right stacks).
  - Three lists: 3 × 4 columns.
  - Full-width table: 12 columns.
- **Card heights:** cards in the same row are equal height (`items-stretch`).

### 4.3 Responsive behaviour

| Breakpoint | Behaviour |
| --- | --- |
| ≥ 1280 px (`xl`) | Full layout as above. |
| 1024–1279 px (`lg`) | Same layout, page gutter drops to 32 px. KPI row stays at 4 columns if each card is ≥ 220 px wide, otherwise 2. |
| 768–1023 px (`md`) | The sidebar becomes an off-canvas drawer, opened by the « / ☰ button in the top bar. KPI row 2 columns; chart rows stack to 1 column. |
| < 768 px | Page gutter 16 px; everything 1 column. Top-nav links move into the drawer. Tables scroll horizontally inside their card. |

---

## 5. Shape and elevation

| Property | Value |
| --- | --- |
| Card, button, badge and icon-tile radius | **4 px** (`rounded`) |
| Top-nav pill radius | 6 px (`rounded-md`) |
| Avatars, progress bars, chart ring ends | full (`rounded-full`) |
| Bar-chart bars | 2 px top corners only |
| Card shadow | `0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)`. Close to Tailwind `shadow-sm`, slightly softer. No visible card border. |
| Dividers | 1 px `slate-200` |

---

## 6. Components

### 6.1 Sidebar

- **Container:** 256 px wide, `bg-slate-800`, full height, scrolls on its own.
- **Logo bar:** 56 px tall, `bg-slate-900`, padding `0 16px`.
  - Logo: a wordmark or icon plus wordmark, 18 px, white, weight 500.
  - On the right: a collapse button (double chevron «), 20 px icon in `slate-400`.
- **Groups:** separated by a section label (11 px, 600, uppercase, `tracking-widest`, `slate-500`, padding `20px 16px 8px`).
- **Item:** 36 px tall, padding `0 16px`, icon-to-text gap 10 px.
  - Icon: 18 px, stroke 1.5 (outline style, e.g. Heroicons or Lucide), in `slate-400`.
  - Label: 14 px, `slate-400`.
  - Expandable items have a 16 px chevron at the far right: pointing right when closed, down when open.
- **States:**
  - Hover: text and icon turn white. No background change, or optionally `bg-slate-700/40`.
  - **Active:** label white, weight 500; icon `blue-500`. The parent of the active page is expanded with its chevron pointing down.
- **Nested items** (level 2): a 4 px round bullet in `slate-500` at x = 24, label at x = 44 (aligned with level-1 labels), same 36 px row height.
- **Nested items** (level 3): bullet at x = 32, label at x = 52.
- **Collapsed mode** (optional): 72 px wide, icons only, with tooltips on hover.

### 6.2 Top bar

- **Container:** 70 px tall, white, 1 px `slate-200` bottom border. Horizontal padding 48 px, matching the content gutter.
- **Left:** text links (14 px, `slate-700`), each with padding `8px 12px`, 16 px apart.
  - Active link: a pill (`bg-slate-100`, radius 6 px, 37 px tall) behind the label.
  - Hover: `bg-slate-50`.
- **Right:** the user avatar, 40 px round, opening a dropdown menu. Optional extras, placed to its left: search, notifications.

### 6.3 Page header band

- **Container:** 60 px tall, `bg-slate-100` (same as the canvas), with a 1 px `slate-200` bottom border. Padding `0 48px`, items vertically centred.
- **Contents, left to right:**
  - Page title: 18 px, 600, `slate-900`.
  - A 1 px × 20 px vertical divider in `slate-300`, with 16 px margin either side.
  - Breadcrumb: 14 px; links in `slate-500`, separators as 12 px chevrons (›) in `slate-500` with 12 px margins, current page in `slate-700`.
- **Optional:** page actions aligned right (buttons, date picker).

### 6.4 Card

```
┌──────────────────────────────────────────┐
│  Card title (16/500)          [⋮ actions]│  ← header 56 px, padding 0 24, bottom border
├──────────────────────────────────────────┤
│  body, padding 24                        │
└──────────────────────────────────────────┘
```

- **Container:** `bg-white rounded shadow-card`.
- **Header** (optional): 56 px, the title on the left and a kebab (⋮, 20 px, `slate-500`) or icon buttons on the right, with a 1 px `slate-200` bottom border.
- **Body:** padding 24 px. Tables and charts may bleed to the card edges horizontally.

### 6.5 KPI cards (four variants)

All variants share: white card, padding 24 px, an uppercase 12 px label in `slate-600`, and a semibold value in `slate-900`. Put 4 in a row, or 3 in a row on project pages.

**A. Value + badge** (sales dashboard), ≈ 120 px tall:
```
TOTAL SALES
$59k  [↑ 24%]
from last month
```
- Label, then 12 px gap, then the row "value (20/600) + badge" with an 8 px gap, then 12 px gap, then "from last month" (14 px, `slate-600`).

**B. Value + sparkline** (project and traffic cards), ≈ 168 px tall:
```
TOTAL BUDGET
$372k         ╱╲__/\_/\__        ← sparkline, right side, ~220×48
[↑ 12%] from last month
```
- Value 24/600 on the left. The sparkline sits on the right, vertically centred with the value: a 2 px `blue-600` line, no fill, no axes, no dots.
- Bottom row: badge, then 8 px gap, then "from last month" (12 px, `slate-600`).

**C. Value + mini ring** (budget overview), ≈ 82 px tall, single row:
```
TOTAL BUDGET          ◔
$372k
```
- Label above a 20/600 value on the left. On the right, a 56 px progress ring: 7 px stroke, `gray-200` track, `blue-600` arc, round caps, starting at 12 o'clock and running clockwise. No number inside.

**D. Icon highlight** (inside a "24 hours highlights" card): a 2 × 2 grid of items, each:
```
[icon tile 48]  9318 Visitors     ← 14/500 slate-900
                last 24 hours     ← 14/400 slate-500
```
- Icon tile: 48 × 48, radius 4, gradient `blue-100` → `blue-50`, 20 px outline icon in `blue-600`. The tile-to-text gap is 12 px; the grid gaps are 32 px across and 32 px down.

### 6.6 Trend badge

- 22 px tall, padding `0 8px`, radius 4, 12 px / 600. Contents: an arrow icon (10 px ↑ or ↓, stroke 2.5), a 2 px gap, then the value with %.
- **Up:** `bg-green-100 text-green-600`. **Down:** `bg-red-100 text-red-600`.
- Never show a trend by colour alone; the arrow is always there.

### 6.7 Buttons

| Variant | Spec |
| --- | --- |
| Primary | 38 px tall, padding `0 16px`, radius 4, `bg-blue-600 text-white`, 14 px / 500. Hover `bg-blue-700`. Focus ring: 2 px `blue-500` at 2 px offset. |
| Secondary | Same size, `bg-slate-100 text-slate-700`. Hover `bg-slate-200`. |
| Icon button | 36 × 36, transparent, 20 px icon in `slate-500`. Hover `bg-slate-100`, radius 4. Used for sliders, calendar and kebab. |
| Text link | `text-blue-600` 600. Hover underline. Used inline in sentences ("Made a **deal** for $37k"). |

Place primary actions on the right, with the secondary button left of the primary and 12 px between them.

### 6.8 Tabs

- The tab row is inside a card, 52 px tall, with 1 px `slate-200` dividers above and below. Padding left 24 px.
- Each tab is 14 px, `slate-600`, with 28 px between labels. Hover: `slate-900`.
- **Active:** `text-blue-600`, weight 500, with a 2 px `blue-600` underline sitting on the bottom divider. The underline spans the label plus 8 px on each side.
- Example set: Overview · Team · Members · Budget · **Activity** · Tasks · Files · Settings.

### 6.9 Data table

- Lives inside a card. The card title sits above the table in the normal 56 px header (without a divider, because the table header row follows).
- **Header row:** 50 px tall, `bg-slate-50`; labels are 12 px / 600, uppercase, `tracking-widest`, `slate-600`. The first column has 16 px left padding.
- **Body rows:** 72–85 px tall when they contain two-line cells, 52 px for single-line rows. **No row dividers**: whitespace separates the rows. Optional hover: `bg-slate-50`.
- **Person cell:** a 36 px round avatar, a 20 px gap, then the name (14/500 `slate-900`) with the email or meta (14/400 `slate-600`) under it, 4 px apart.
- **Numeric cells:** 14 px `slate-700`, tabular numbers, left-aligned in the reference. Right-align currency if the column is long.
- **Icon + value cells:** a 16 px outline icon in `slate-600` with 8 px gap before the value (e.g. a clipboard icon with "14/14").
- **Progress cell:** see 6.10.
- **Row actions:** a kebab (⋮) at the far right, 20 px, `slate-500`.
- **Example columns:** TEAM MEMBER · BUDGET · TASKS · PROGRESS · ⋮

### 6.10 Progress bar

- 8 px tall, fully rounded, ≈ 160 px wide in tables (fills the column elsewhere).
- Track `blue-100`. Fill:
  - `blue-600` normally.
  - `green-400` when complete (100 %).
  - `slate-400` when stale or paused, with a `slate-200` track.

### 6.11 Avatars

- Sizes: 36 px in tables and the avatar stack, 40 px in the top bar, 48 px in activity timelines. Always round, with an `object-cover` photo.
- **Avatar stack:** 36 px, overlapping by 8 px, each with a 2 px white ring. Show at most 4, then a "+N" circle (`bg-slate-100 text-slate-600`, 12/600).
- **Fallback:** initials, 14/600, on `bg-blue-100 text-blue-700`.

### 6.12 Entity header card (project detail)

A full-width card at the top of a detail page:

- **Left:** a 128 × 128 icon tile with the emerald gradient (`emerald-100` → `emerald-50`) and a 40 px solid icon (e.g. briefcase) in `emerald-500`, centred. 24 px margin from the card edge.
- **Middle,** 32 px gap from the tile:
  - Title: 18/500 `slate-900`.
  - Description: 14 px `slate-600`, 8 px below the title.
  - Meta row, 20 px below: icon + text pairs (18 px outline icon in `slate-500`, 6 px gap, 14 px `slate-600` text), e.g. "🕑 188h · 📋 36 tasks left · 👥 4 Members", 20 px between pairs, followed by an avatar stack.
- **Right:** the secondary "Edit Project" and primary "Create task" buttons, top-aligned.
- **Bottom:** the tab row (6.8) spans the full card width.

### 6.13 Charts

General rules:
- **Font:** the project font (Poppins or Instrument Sans), 12 px, axis labels in `slate-500`. Set it explicitly in the chart library; most default to Helvetica or Arial.
- **Gridlines:** horizontal only, 1 px `gray-200`. No vertical gridlines and no axis lines, except the baseline in `gray-200`.
- **Plot padding:** 24 px from the card edges. The y-axis labels sit right-aligned, 8 px left of the plot.
- **Tooltip:** a white card with `shadow-card`, radius 4, padding `8px 12px`; title 12/600 `slate-900`, value 14/600, series swatch 8 px.
- **Legend:** below the chart, centred. Each item is a 14 × 8 px swatch (radius 1), a 6 px gap and a 12 px label in `slate-600`, with 24 px between items.

**Bar chart (single series):** "Sales per month"
- 12 categories (Jan–Dec), y-axis 0–800 in steps of 100.
- Bars are 18 px wide (about a third of each category slot), in `blue-600`, with 2 px top radius.

**Grouped bar chart (two series):** "Mobile vs Desktop"
- For each category, two 16 px bars with a 2 px gap: series 1 in `blue-600`, series 2 in `indigo-200`.

**Donut chart:** "Sales per category"
- About 244 px across with a 30 px ring, centred in its card. 2 px white gaps between segments. Starts at 12 o'clock and runs clockwise. The centre is empty, or shows a total (20/600 above a 12 px label).
- Segment colours in order: `blue-700` `#1D4ED8`, `blue-600` `#2563EB`, `indigo-200` `#C7D2FE`, `indigo-100` `#E0E7FF`. For more than 4 segments, add `blue-400` `#60A5FA`, then `slate-300` `#CBD5E1`.
- Legend below (Online · Shop · Dropshipping · Direct).

**Sparkline:** see KPI variant B. Smooth or straight segments, 2 px stroke, `blue-600`, about 220 × 48.

**Mini ring:** see KPI variant C.

**Inline bar (ranking tables):** "Top 5 countries"
- 8 px tall, fully rounded, with a `blue-100` track and `blue-600` fill sized to the percentage. It fills the PERCENTAGE column (≈ 274 px).
- Rows are 53 px tall: country (14 px `slate-700`), visitors (14 px `slate-700`, tabular), bar.

Recommended libraries: Recharts or Chart.js for React and Next.js, ApexCharts for Laravel/Blade. Set the colours, gridlines, fonts and radii above explicitly; don't accept library defaults.

### 6.14 Lists

**Activity timeline:** "Sales activity overview"
- Group label (TODAY, YESTERDAY): 12/600 uppercase `slate-600`, 24 px above the first item.
- Each item: a 48 px avatar, a 32 px gap, then two lines of text: the actor (14/500 `slate-900`), then the action (14 px `slate-600`) with an inline link in `blue-600`/600 (e.g. "Made a **deal** for $37k").
- A 2 px `slate-200` vertical line joins the centres of consecutive avatars, running behind them. Items are 80 px apart.

**Deal / entity list:** "Active deals"
- Each item: a 48 × 48 icon tile (coloured pairs, see 2.3), a 16 px gap, then a name (14/500 `slate-900`) with an amount (14 px `slate-600`, tabular) below it. Items are 72 px apart and have no dividers.

**Checklist:** "Call list"
- Group labels: "TODAY'S CALLS (2)", "TOMORROW'S CALLS (2)" (12/600 uppercase `slate-600`, with the count in brackets).
- Each row is 40 px tall: a 16 px checkbox (radius 3, `slate-300` border; when checked, `bg-blue-600` with a white tick), a 16 px gap, then the name (14 px `slate-700`). Checked names get a line-through and turn `slate-500`.
- At the right: an 18 px phone icon in `slate-500`, 12 px gap, then the phone number (13 px `slate-600`, tabular, `tracking-wide`). The number is a `tel:` link.

### 6.15 Section header on the canvas

- Used above a group of cards (e.g. "Monthly Analytics") instead of a card header.
- Title 16/500 `slate-900` on the left; icon buttons on the right (sliders = filters, calendar = date range, ⋮ = more), each 36 px with 8 px between them.
- 24 px gap to the cards below.

### 6.16 Forms (implied by the system, for consistency)

- **Input:** 38 px tall, padding `0 12px`, radius 4, white, 1 px `slate-300` border, 14 px `slate-900` text, `slate-400` placeholder.
  - Focus: `blue-500` border with a 3 px `blue-100` ring.
  - Error: `red-500` border, with an error message in 12 px `red-600` below.
- **Label:** 14/500 `slate-700`, 6 px above the input. Help text: 12 px `slate-500`.
- **Select, date input:** same as the input, with a 16 px chevron or calendar icon in `slate-500` on the right.
- **Checkbox and radio:** 16 px, `blue-600` when checked.
- **Toggle:** 36 × 20, `slate-300` off, `blue-600` on, with a white 16 px knob.

---

## 7. Iconography

- **Style:** outline icons with a 1.5 px stroke (Heroicons Outline or Lucide). Use solid style only inside icon tiles.
- **Sizes:** 16 px in tables and badges, 18 px in the sidebar and meta rows, 20 px in icon buttons and highlight tiles, 40 px in large entity tiles.
- **Colour:** inherits the text colour (`currentColor`); `slate-500` by default, `blue-600` in blue tiles.

---

## 8. Page templates

### 8.1 Overview / sales dashboard

```
Page header: "Dashboard" | Home › Page › Current
Row 1  [KPI A: TOTAL SALES $59k ↑24%] [TOTAL REFUNDS 4K ↑69%] [TOTAL DEALS 14 ↓19%] [TOTAL DISCOUNT $29k ↑42%]   (4 × 3 cols)
Row 2  [Card: Sales per month — bar chart, 12 months]  (7–8 cols)   [Card: Sales per category — donut + legend]  (4–5 cols)
Row 3  [Card: Sales activity overview — timeline]  [Card: Active deals — icon-tile list]  [Card: Call list — checklist]   (3 × 4 cols)
```

### 8.2 Analytics dashboard

```
Page header: "Dashboard" | breadcrumb
Section header: "Monthly Analytics"                          [filters] [calendar] [⋮]
Row 1  [KPI C ring: TOTAL BUDGET $372k] [TOTAL SPEND $87k] [TOTAL LEFT $58k] [OVER BUDGET $172k]   (4 × 3 cols)
Row 2  Left 6 cols:  [Card: 24 hours highlights — 2×2 icon highlights]
                     [Card: Mobile vs Desktop — grouped bar chart]
       Right 6 cols: [Card: Top 5 countries — table with inline bars]
                     [KPI B: INTERNATIONAL TRAFFIC 12.281 ↑78%] [KPI B: LOCAL TRAFFIC 402 ↑92%]
                     [KPI B: DESKTOP TRAFFIC 42,439]            [KPI B: MOBILE TRAFFIC 2810]
```

### 8.3 Entity detail page (project)

```
Row 1  [Entity header card: icon tile · title · description · meta + avatars · Edit / Create buttons · tab row]
Row 2  [KPI B: TOTAL BUDGET $372k ↑12%] [KPI B: TOTAL HOURS 21.261 ↑69%] [KPI B: TOTAL BUGS 49 ↓19%]   (3 × 4 cols)
Row 3  [Card: Project Members — data table: member · budget · tasks · progress · ⋮]   (12 cols)
```
This page has no page-header band: the entity card replaces it, and content starts 32 px below the top bar.

### 8.4 List / CRUD page (derived)

```
Page header: "Customers" | breadcrumb                           [Secondary: Export] [Primary: + New customer]
Row 1  [Card: toolbar (search input 280 px, filter selects, view toggle) + data table + pagination footer]
```
- Pagination footer: 56 px, a top divider, "Showing 1–10 of 248" (14 px `slate-600`) on the left, and Previous / page numbers / Next on the right (36 px square buttons, the active one `bg-blue-600 text-white`).

---

## 9. Number and content formatting

- **Large money values:** abbreviate with `k` / `M` and no decimal on cards ("$372k", "$29k"). Show full values in tables ("€22.841").
- **Percentages:** whole numbers with an arrow ("↑ 24%").
- **Counts:** grouping separator per locale ("62,122" in English; "21.261" in locales that use a dot).
- **Sub-labels under KPIs:** always relative ("from last month", "last 24 hours").
- **Empty states:** inside the card, centre a 40 px `slate-300` icon, a 14/500 `slate-700` title, a 14 px `slate-500` hint and an optional secondary button.
- **Loading:** skeleton blocks in `slate-100` with a pulse, matching the shape of the final content (lines, bars, circles). Never leave a card blank.

---

## 10. Accessibility

- **Contrast:** body text on white uses `slate-600` or darker (≥ 7:1); labels in `slate-500` on white are ≥ 4.5:1. Don't put `slate-400` text on white; it's for the dark sidebar only.
- **Trends:** pair colour with an arrow and the % value.
- **Charts:** give each one an `aria-label` summary (e.g. "Sales per month, highest in November at 800") and a visually hidden data table, or let the tooltip be reached by keyboard.
- **Navigation:** the sidebar is a `<nav>` with `aria-current="page"` on the active link. Expandable groups are buttons with `aria-expanded`.
- **Icon-only buttons:** need an `aria-label` ("Filters", "Pick date range", "More actions").
- **Touch targets:** at least 36 px on desktop and 44 px on touch layouts.
- **Focus:** always visible, as a 2 px `blue-500` ring at 2 px offset.

---

## 11. Tailwind recipes

```html
<!-- App shell -->
<body class="bg-slate-100 font-sans text-sm text-slate-700 antialiased">
  <aside class="fixed inset-y-0 left-0 w-64 bg-slate-800">
    <div class="flex h-14 items-center justify-between bg-slate-900 px-4 text-lg font-medium text-white">Brand <button class="text-slate-400">«</button></div>
    <p class="px-4 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Pages</p>
    <a class="flex h-9 items-center gap-2.5 px-4 text-slate-400 hover:text-white">…</a>
    <a aria-current="page" class="flex h-9 items-center gap-2.5 px-4 font-medium text-white [&>svg]:text-blue-500">…</a>
  </aside>
  <div class="ml-64">
    <header class="flex h-[70px] items-center border-b border-slate-200 bg-white px-12">
      <a class="rounded-md bg-slate-100 px-3 py-2 text-slate-700">Dashboard</a>
      <a class="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50">Pages</a>
    </header>
    <div class="flex h-[60px] items-center border-b border-slate-200 px-12">
      <h1 class="text-lg font-semibold text-slate-900">Dashboard</h1>
      <span class="mx-4 h-5 w-px bg-slate-300"></span>
      <nav class="text-sm text-slate-500">Home › Page › <span class="text-slate-700">Current</span></nav>
    </div>
    <main class="grid grid-cols-12 gap-6 px-12 pb-12 pt-8">…</main>
  </div>
</body>

<!-- KPI card, variant A -->
<div class="col-span-12 rounded bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,.06),0_1px_2px_rgba(15,23,42,.04)] sm:col-span-6 xl:col-span-3">
  <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Total sales</p>
  <div class="mt-3 flex items-center gap-2">
    <span class="text-xl font-semibold text-slate-900 tabular-nums">$59k</span>
    <span class="inline-flex h-[22px] items-center gap-0.5 rounded bg-green-100 px-2 text-xs font-semibold text-green-600">↑ 24%</span>
  </div>
  <p class="mt-3 text-sm text-slate-600">from last month</p>
</div>

<!-- Card with header -->
<section class="rounded bg-white shadow-[…]">
  <header class="flex h-14 items-center justify-between border-b border-slate-200 px-6">
    <h2 class="text-base font-medium text-slate-900">Sales per month</h2>
  </header>
  <div class="p-6">…</div>
</section>

<!-- Buttons -->
<button class="h-[38px] rounded bg-blue-600 px-4 font-medium text-white hover:bg-blue-700">Create task</button>
<button class="h-[38px] rounded bg-slate-100 px-4 font-medium text-slate-700 hover:bg-slate-200">Edit Project</button>

<!-- Table header and progress -->
<thead class="bg-slate-50 text-xs font-semibold uppercase tracking-widest text-slate-600">…</thead>
<div class="h-2 w-40 rounded-full bg-blue-100"><div class="h-2 rounded-full bg-blue-600" style="width:80%"></div></div>
```

**Tailwind config additions:**

```js
// tailwind.config.js (v3), or the @theme equivalents in v4
theme: {
  extend: {
    fontFamily: { sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    // or: sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    boxShadow: { card: '0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)' },
    height: { topbar: '70px', pageheader: '60px' },
  },
}
```

---

## 12. Do / don't

| Do | Don't |
| --- | --- |
| Keep one accent (blue-600) and its tints | Add a second brand colour for decoration |
| Use green and red only for trends and status | Colour whole cards red or green |
| Align every card to the 12-column grid with 24 px gaps | Mix gap sizes or nest cards inside cards |
| Uppercase small labels, large semibold values | Use bold body text or uppercase titles |
| Separate rows and items with whitespace | Add zebra stripes or row borders |
| Give charts plain axes and light gridlines | Use 3D, gradients, drop shadows or default library palettes in charts |
| Keep the radius at 4 px everywhere (full for pills) | Use large rounded corners (12 px+) on cards |
| Show sparklines and rings without axes | Put numbers inside mini rings or sparklines |

---

## 13. Build checklist for a new dashboard

1. Load Poppins or Instrument Sans (400/500/600), e.g. with `next/font/google` in Next.js or a Google Fonts `<link>` in Laravel/Blade. Set the body to 14 px `slate-700` on `slate-100`.
2. Add the tokens (section 2.4) and the `shadow-card` utility.
3. Build the shell: sidebar (6.1), top bar (6.2), page header (6.3), content grid (4.2).
4. Build the primitives: Card, CardHeader, KpiCard (A/B/C/D), TrendBadge, Button (primary, secondary, icon), Tabs, DataTable, ProgressBar, Avatar and AvatarStack, IconTile, SectionHeader.
5. Build the chart wrappers with the fixed styling from 6.13: BarChart, GroupedBarChart, DonutChart, Sparkline, MiniRing, InlineBar.
6. Compose pages from the templates in section 8.
7. Check: equal card heights in each row, a 24 px gap everywhere, no colour outside the token list, the contrast rules from section 10, and the layout at 1600, 1280, 1024, 768 and 390 px.
