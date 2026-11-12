# Apparatus visual system

The existing React / Konva workbench remains the interactive renderer. SVG inventory illustrations and educational previews reuse the same geometry and material definitions. The simulation, chemical quantities, port positions, camera coordinates and tube anchors remain authoritative.

## Source map

| Concern | Source |
| --- | --- |
| Glass materials, six vessel silhouettes, inner boundaries and volume graduations | `src/features/lab/visuals/apparatus.ts` |
| Metal, rubber, wood and glass utility geometry | `src/features/lab/visuals/utilityGeometry.ts` |
| Workbench vessel layers, liquid, highlights, reduced-motion clock | `src/features/lab/components/LabVisuals.tsx` |
| SVG illustrations and shared preview glass layers | `src/features/lab/components/EquipmentIllustration.tsx` |
| Utilities, water bath, tube reflection, snap preview and camera | `src/features/lab/components/WorkbenchScene.tsx` |
| State-driven precipitation, solids, dissolution and bubbles | `src/features/lab/components/ReactionEffectLayers.tsx`, `src/engine/effectComposer.ts` |
| Attachment and port coordinates | `src/engine/connectionLogic.ts` |
| Drawing, smoothing and anchored tube bends | `src/engine/tubeGeometry.ts` |
| Addition, transfer, rotation, undo and UI integration | `src/features/lab/LabPage.tsx` |
| Heating and gas/water displacement | `src/engine/heatingLogic.ts`, `src/engine/timeSimulation.ts` |
| Chemistry sample bottles | `src/features/lab/components/ChemicalBottle.tsx` |
| Shared marketing/library experiment illustrations | `src/shared/components/LabArt.tsx` |
| Magnified rotated apparatus | `src/features/lab/components/ObservationLens.tsx` |

## Layers and geometry

Each vessel has a shadow, back glass, clipped state-driven contents/effects, front glass reflections, rim and markings, and a separate invisible hit path. Decorative Konva groups set `listening={false}`; SVG decorations disable pointer events. Utility geometry retains the old object origins so snap and connection coordinates do not shift.

`liquidGeometry` transforms the inner boundary into world coordinates, solves a horizontal fill level for the requested volume ratio, then transforms the clipped polygon back to vessel coordinates. The result supports upright, tilted and inverted vessels. Graduation positions use the same upright mapping, including cylinders. This is a calibrated **2D educational projection**, not a physical 3D volume solver or a certified measuring scale. No chemical quantity is inferred from pixels or changed by rendering.

Geometric projection and markings are memoized by shape, volume, capacity and angle. Only the moving vessel receives a small temporary slosh offset. Reaction effects are clipped to both the vessel and liquid, while dry solids can appear in an empty vessel. Material rendering uses gradients and strokes, without full-scene blur or external raster assets.

## Interaction and simulation

All 18 existing apparatus types use the new material family. An additional `alcoholBurner` is registered as a non-container utility alongside the existing Bunsen burner. It shares ignition checks, power, temperature integration and automatic shutdown, including the existing hydrogen and sealed-vessel interlocks.

The water bath remains part of the existing prepared, inverted gas-collection assembly, rather than a new independently simulated vessel. Its collected gas and displaced water continue to use the existing engine. The engine currently supports one outgoing gas connection per source; the new stopper keeps that contract.

Gas flow is gated by `composeVesselEffects(...).gasActive`, the source seal and a real connection. Dropper animation is recorded only after an accepted small liquid addition near the container mouth. Unsupported evaporation, condensation and crystallization are not invented by the visual layer. Existing reaction pauses, finite stock, transfer conservation, assignment tracking and persistence are preserved.

Reduced motion keeps bubble positions, flame shape and tube dashes static; state updates continue so chemical progress stays visible. The clock uses a lower visual refresh rate in this mode, and stops when there is no activity. Glass definitions have unique SVG IDs per instance.

## Validation

- `npx.cmd vitest run`: chemistry, transfer, effects, attachment geometry, tilted liquid area conservation and alcohol-burner interlocks.
- `npx.cmd playwright test tests/apparatus.spec.ts tests/lab-improvements.spec.ts tests/transfer.spec.ts`: drag/snap, rotated observation lens, gas collection, hose drawing/anchoring, measured transfer/undo, alcohol heating, zoom/pan, assignment behavior and responsive/reduced-motion checks.
- `npm.cmd run build`: TypeScript and production bundle.

Review screenshots under `artifacts/premium-*.png`, particularly `premium-flask-250ml.png`, `premium-flask-tilted.png`, `premium-flask-reacting.png`, `premium-alcohol-burner.png`, and desktop/mobile glassware views.
