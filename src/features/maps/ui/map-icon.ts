"use client";

import { divIcon } from "leaflet";
import type { DivIcon } from "leaflet";

export function createPinIcon(fill = "#0f172a"): DivIcon {
  return divIcon({
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36"><path fill="${fill}" stroke="white" stroke-width="1.5" d="M12 1C5.9 1 1 5.9 1 12c0 8.7 11 23 11 23S23 20.7 23 12C23 5.9 18.1 1 12 1z"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
  });
}

export const defaultPinIcon = createPinIcon();
