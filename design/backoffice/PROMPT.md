Paste this into Claude Code in VS Code, from the root of your Next.js project, after copying this folder into the project as `design/backoffice/`.

---

Build the back-office UI in `design/backoffice/` for this Next.js app.

Read these first:
- `design/backoffice/DESIGN_SPEC.md`: layout, shared components, and what every screen contains and does
- `design/backoffice/screens/*.png`: the approved designs (match them closely; `*.mobile.png` shows phone-width behaviour)
- `design/backoffice/tokens.css`: import it into `app/globals.css` and use it for every colour, font, radius and shadow
- `design/backoffice/source/*.dc.html`: reference only, for exact spacing and colours (don't port the HTML)

Requirements:
- App Router with TypeScript. Look at what this project already uses (Tailwind version, component library, folder layout, route naming) and follow it. If Tailwind v4 is set up, use the `@theme` tokens as utilities. Tell me before adding a UI library.
- Load IBM Plex Sans and IBM Plex Mono with `next/font/google` as the CSS variables `--font-plex-sans` and `--font-plex-mono`. Numbers, prices, lot codes and invoice numbers always use Plex Mono.
- All UI text is in French, exactly as in the designs.
- Put sample data in `lib/mock/` with TypeScript types (Medicine, Lot, StockMovement, Supplier, Reception, ReceptionLine, InventoryCount, Return, Adjustment, Device, SalesDay), so the API can replace it later. Totals, KPIs, percentages, cover and order quantities are calculated from that data, never hard-coded.
- Server components by default; client components only where there's interaction.
- Accessible markup: real buttons, links and labelled inputs; tables use proper header cells; the chart has an aria-label summary.
- The layout must work from 390 px to 1920 px: the sidebar stacks above the content on narrow screens, and wide tables scroll inside their card, never the page.
- On Nouvelle réception, move the summary column below the table when there isn't room, so every table column stays visible (see the spec; this differs from the screenshot).
- Only lucide-react for icons and recharts for the sales chart are pre-approved as new dependencies.

Work in this order and stop after each step so I can check it in the browser:
1. Tokens, fonts, the app shell (sidebar with the active route, page header) and the shared components from the spec
2. Phase 1: Tableau de bord, Médicaments, Fiche médicament
3. Phase 1: Import du stock initial, Nouvelle réception
4. Phase 3: Inventaire, Retours, Ajustements & péremptions
5. Phase 4: Rapport des ventes, Consommation & péremptions

When a screen is done, compare it with its PNG and list anything that differs.
