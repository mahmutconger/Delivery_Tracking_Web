---
name: feedback-leaflet
description: Leaflet map marker icons must use a custom divIcon with SVG — default Leaflet image icons break in Next.js webpack
metadata:
  type: feedback
---

Default Leaflet marker icons (PNG images) are broken in Next.js because webpack doesn't resolve the relative image paths from leaflet.css.

**Fix used:** Custom `divIcon` with inline SVG (see `src/features/maps/ui/map-icon.ts`). Also requires `import "leaflet/dist/leaflet.css"` in each map component.

**Why:** No image file dependency, fully self-contained, works in both SSR and CSR.

**How to apply:** Any new `Marker` component must use `icon={createPinIcon()}` from `map-icon.ts`. Never rely on Leaflet's default icon.
