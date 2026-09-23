# Rebar Estimator — prototype

A working prototype of the Jindal Panther **Rebar Estimator**: a four-step wizard that turns a
ground floor area into an indicative TMT rebar requirement and cost.

The live `jindalpanther.com/tmt-calculator` page is currently a "Coming Soon" placeholder. This
fills it in so the flow, the numbers and the brand skin can be reviewed before a production build.

## Run it

```
npm install
npm run dev      # http://localhost:5173
npm test         # 47 tests: 35 engine, 12 render
npm run build    # production bundle into dist/
```

### Two environment gotchas on this machine

Both are already worked around in the repo; they only matter if you re-clone or move it.

1. **Corporate TLS inspection** makes `npm install` fail with `SELF_SIGNED_CERT_IN_CHAIN`.
   Trust the Windows certificate store rather than disabling verification:

   ```powershell
   $env:NODE_OPTIONS = "--use-system-ca"   # Node 18.19+ / 20.6+ / 22+
   npm install
   ```

2. **The `&` in the "Jindal Shadeed Iron & Steel Co" OneDrive path breaks npm's `.bin` shims**, so
   `npx vite` and the usual `"dev": "vite"` script both fail with a bogus
   `Cannot find module 'C:\Users\...\vite\bin\vite.js'`. The scripts in `package.json` therefore
   call the tools' entry points directly, e.g. `node ./node_modules/vite/bin/vite.js`. Keep that
   form, or move the project to a path with no `&` (also spares OneDrive from syncing
   `node_modules`).

## The flow

| Step | Screen |
|---|---|
| 1 | Ground floor area, 578.00 – 1934.00 sq. ft., with a Sq. Ft / Sq. Mts toggle |
| 2 | Ground / G+1 / G+2 |
| 3 | Floor plan gallery with BHK filter chips |
| 4 | Full House, or a single element — slab, beam, column, footing — plus an optional TMT grade |
| → | Result: diameter-wise quantity, editable cost, element split, assumptions, print and share |

## How the estimate is built

Quantities are built **up from five elements**, each against its own reference area, rather than
down from a single kg/sq.ft figure — so the total lands inside the standard Indian residential RCC
band of 3.5–4.5 kg/sq.ft on its own, which is what makes it defensible in review.

| Element | Reference area | kg/sq.ft | Applied |
|---|---|---|---|
| Footing / plinth | ground footprint | 0.75 | once |
| Column | ground footprint | 0.80 | per storey level |
| Beam | slab area | 1.05 | per floor |
| Slab | slab area | 1.10 | per floor |
| Staircase & misc | slab area | 0.20 | per floor |

Scaling with floors is deliberately not uniform:

- slab, beam and misc scale **linearly** with the number of levels;
- the footing is poured **once** and only gets heavier under more load — factor 0.80 / 1.00 / 1.18
  for G / G+1 / G+2;
- each level's columns are sized for **what sits above them** — `1 + 0.15 × storeysAbove`.

Wastage 3% and lap 5% give a combined ×1.0815. The selected floor plan contributes a layout
complexity factor (2BHK 1.00, 3BHK 1.04, 4BHK 1.08) applied to beams, columns and misc only — the
**area you type always wins** over the plan's own area.

Grade (Fe500D / Fe550D / Fe600 / CRS) changes the rate and the label, **never the weight** —
weight is geometry.

Bar counts use the IS 1786 nominal unit weight, `kg/m = d²/162`, over 12 m stock lengths.

Worked example — 1356.25 sq.ft, G+1, 2BHK, Full House:

```
10.517 t gross · 3.88 kg/sq.ft of built-up area · ₹6,63,251 at default grade-wise rates
```

## Where things live

```
src/data/assumptions.js     every number a reviewer might argue with, in one object
src/data/barConstants.js    diameters, 12 m length, d²/162
src/data/floorPlans.js      the 8 gallery plans and their room rectangles
src/lib/estimator.js        the engine — estimate() and recost()
src/lib/estimator.test.js   35 engine tests
src/lib/validation.js       range checks, error and warning codes
src/lib/units.js            sq.ft ⇄ sq.m, kg ⇄ t, currency formatting
src/lib/share.js            text summary, clipboard, download, print
src/hooks/useEstimator.js   wizard state plus the memoised engine call
src/components/             wizard steps, result cards, shared UI, plan SVGs
src/components/render.test.jsx  12 server-render smoke tests
```

`src/lib/estimator.js` imports only from `src/data/*` and `src/lib/units.js` — no React anywhere
under `src/lib/` — so the engine can be lifted into a server endpoint or a widget on the live site
untouched.

## Tuning it

Everything debatable is in `src/data/assumptions.js`: base rates, the diameter mix per element,
storey factors, wastage and lap, grade defaults, and the rate table. The result screen's
**Assumptions used** panel prints whatever is in there, so a reviewer can see exactly which knob to
turn.

The currency block (`currency`, `locale`, `currencySymbol`, `ratePerTonne`) is one unit — swap it
for OMR if this is aimed at the Oman market rather than Jindal Panther India.

## Not a structural design

Every result screen, print output and shared summary carries the disclaimer, and it cannot be
stripped from an export. The numbers are indicative thumb rules for low-rise residential RCC, not a
substitute for a licensed structural engineer.
