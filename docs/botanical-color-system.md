# Fresh Emerald, Soft Mint & Warm Cream

The retained theme filename is `botanical-theme.css`; its active palette is now the Laboo-inspired emerald/mint/cream system. Existing layouts, responsive breakpoints, apparatus geometry and simulation behavior are preserved. No new page or renderer was introduced.

## Central tokens

| Role | Token | Color |
| --- | --- | --- |
| Primary emerald | `--brand-primary` | `#238D73` |
| Brand emerald | `--brand-green` | `#209B79` |
| Hover / active text / focus | `--brand-primary-hover`, `--text-link`, `--border-focus` | `#18745F` |
| Light mint / selected | `--brand-primary-subtle`, `--bg-selected` | `#DFF3EB` |
| Very light mint / hover | `--bg-hover` | `#EFF9F4` |
| Main background | `--bg-app`, `--bg-page` | `#FAFCFA` |
| Warm cream | `--bg-surface-secondary` | `#F6F3EB` |
| Cards / header / sidebar / dialogs | `--bg-surface` | `#FFFFFF` |
| Laboratory wall | `--lab-wall` | `#FFFFFF` |
| Table surface | `--lab-bench` | `#E7E4DB` |
| Table front edge | `--lab-bench-front` | `#C8C2B5` |
| Pastel orange | `--accent-orange` | `#F5BD69` |
| Pale orange / readable orange text | `--accent-orange-soft`, `--accent-orange-ink` | `#FFF3E0` / `#674018` |
| Primary text | `--text-primary` | `#23352E` |
| Secondary reference | `--text-secondary-reference` | `#657B75` |
| Accessible secondary text | `--text-secondary`, `--text-muted-accessible` | `#5C716B` |
| Accessible emerald button | `--button-accessible` | `#1E8069` |

## Readability decisions

White small text on the exact primary `#238D73` reaches 4.09:1, below AA for ordinary text. Buttons use the nearby emerald `#1E8069` with white text (4.83:1), and `#18745F` on hover (5.67:1). The exact primary remains on large headings and accents; the exact brand green is used on the wordmark and decorative branding.

The requested secondary reference `#657B75` is retained in a token. General secondary text uses `#5C716B`, a slightly stronger version, to remain readable on both warm cream and mint (including 4.51:1 on selected mint). Orange uses dark brown labels (5.32:1), never white labels.

## Application

- Landing page: emerald title/branding, mint brush decoration, cream secondary sections, and restrained orange pricing highlights.
- Header/sidebar: white surfaces, light borders, mint active items and readable emerald navigation.
- Teacher/student dashboards: white cards, mint information areas, distinct complementary metric/chart colors, and pastel orange for one metric/score emphasis.
- Library, materials, forms, tables and dialogs: shared surfaces, text, focus, hover and disabled tokens.
- Laboratory: neutral wall/table/front edge and existing contact shadows. Selection and controls use mint/emerald. Chemical liquids, precipitates, glass reflection, flames and reaction particles are unchanged.
- Admin/Reaction Studio: shared emerald buttons with white text, mint selection and the same focus/disabled tokens.

No chemistry data, engine files, drag/drop logic, port coordinates or camera transforms were edited.

## Files changed for this palette update

1. `src/styles/tokens.css` - centralized emerald, mint, cream, orange and accessible text/button tokens.
2. `src/styles/botanical-theme.css` - shared component colors, score/metric accents and button states.
3. `public/hero-ink.svg` - mint/emerald brand decoration.
4. `scripts/check-contrast.mjs` - validates the actual accessible button/text pairs and orange/mint pairs.
5. `tests/botanical-theme.spec.ts` - updated palette assertions, default/hover contrast and responsive coverage.
6. `tests/workbench-depth.spec.ts` - updated neutral plane pixel expectations.
7. `docs/botanical-color-system.md` - this token/change report.
8. `docs/workbench-depth.md` - current laboratory palette reference.

## Validation

- `node scripts/check-contrast.mjs` checks 23 text/status/grade color pairs against 4.5:1 and writes `artifacts/color-contrast.json`.
- `tests/botanical-theme.spec.ts` covers public pages, student/teacher tools, admin login and lab surfaces at 1440, 768 and 390 px; it checks actual computed button contrast, focus, overflow and unchanged CuSO4 swatches.
- `tests/workbench-depth.spec.ts` checks all three laboratory planes after zoom/pan, preserved object coordinates and support dragging.
- `tests/apparatus.spec.ts` covers rotation, stopper snap, gas collection, measured transfer/undo, alcohol heating, dropper dosing and reduced motion.
- `npm.cmd run build` validates TypeScript and the production bundle.

Representative screenshots remain at `artifacts/botanical-home-1440.png`, `botanical-home-390.png`, `botanical-teacher-1440.png`, `botanical-lab-1440.png` and `workbench-depth-desktop.png`.

These checks cover representative screens and control states, not every possible populated dataset. Historical colors remain in legacy CSS underneath the semantic theme for compatibility. AI connectivity/configuration is outside this visual update.
