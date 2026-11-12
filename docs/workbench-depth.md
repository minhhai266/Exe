# Laboratory workbench depth

The existing `WorkbenchScene` and Konva renderer now draw distinct background, tabletop and front-edge planes. Apparatus origins, silhouettes, sizes, camera transform, drag bounds, snap targets, tube anchors and chemistry state are unchanged.

- Wall: `--lab-wall: #FFFFFF`.
- Tabletop: `--lab-bench: #E7E4DB`.
- Front edge: `--lab-bench-front: #C8C2B5`.
- Glass outline: shared `apparatusMaterial.glassStroke: #7396A8`.
- Hover, selection and interaction focus: primary botanical green `#238D73`.

`BenchBackdrop` owns the complete background. The previous extra rectangle at y=465 no longer paints over it. The drawing-only tabletop extends from world y=405 to y=495, followed by a 16-unit front edge; these constants do not participate in placement calculations. Flat fills, a faint grid and thin edge highlights create depth without a strong gradient or blur.

Contact shadows are drawn before apparatus and tubes in a non-interactive world-space group. Their positions derive from the current displayed object pose, including drag previews, rather than inheriting the object's rotation. Mounted apparatus do not receive floating tabletop shadows. A prepared inverted gas jar uses the existing water-bath shadow instead of a shadow at the top of the jar. These are small contact ellipses, not a new physical lighting simulation.

The large dashed selection box is replaced by a subtle silhouette highlight for glassware and short corner marks for utilities. The original invisible hit rectangles and tube hit widths are retained. Shadows, background, highlights, ghost previews and corner marks all use `listening={false}`. Canvas ports and editing handles use green outlines; HTML port labels retain their RA/VÀO meaning, with green hover/focus styling. Port buttons are above the canvas at z-index 5; camera controls remain at z-index 4.

No chemical color data, liquid clipping, reaction effects or chemical simulation logic was modified. The shared glass stroke also keeps inventory SVGs and workbench glassware consistent.

Validation includes pixel checks for all three drawing-plane colors before/after zoom and pan, unchanged model coordinates, hover hit testing, dragging a support with attached glass, shadow projection tests, existing transfer/gas/heating/tube interactions, and responsive theme checks at 1440, 768 and 390 px. Representative previews: `artifacts/workbench-depth-desktop.png`, `workbench-depth-zoomed.png`, `workbench-depth-selected.png`.
