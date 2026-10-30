# Pharmacy back office: handoff for Claude Code (Next.js)

The 10 approved back-office screens, packaged so Claude Code can build them in a Next.js app:

- **Phase 1:** dashboard, medicines, medicine form, opening-stock import, receiving
- **Phase 3:** stock count, returns, adjustments
- **Phase 4:** sales report, consumption report

| File | What it is |
| --- | --- |
| `screens/` | Full-page PNG of each screen at 1440 px (2×), plus phone-width versions of 3 screens |
| `DESIGN_SPEC.md` | App shell, shared components, routes and a screen-by-screen spec |
| `tokens.css` | Colours, fonts, radii and shadow as CSS variables and a Tailwind v4 `@theme` block |
| `source/` | The HTML the designs were rendered from (reference only) |
| `PROMPT.md` | The prompt to paste into Claude Code |

## Using it in VS Code

1. Unzip and copy this folder into your Next.js project as `design/backoffice/`.
2. Open the project in VS Code and start Claude Code.
3. Paste the prompt from `PROMPT.md`.
4. Run `npm run dev` and check each step in the browser as Claude Code finishes it.

The colours and fonts match the tablet and mobile handoffs, so all three apps look like one product.
