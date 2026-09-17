/**
 * Geographic to Three.js Local World Coordinate Projection
 * 
 * Maps Singapore Tuas/Jurong coordinates [lng, lat] from NaviOps data
 * into a centered, scaled Three.js [x, y, z] coordinate system.
 * 
 * World Orientation:
 *   +X: East
 *   -X: West
 *   +Y: Up (Elevation)
 *   -Z: North
 *   +Z: South
 */

import { PORT_CENTER } from "@/data/port-twin-data";

// Center point: [103.754, 1.255]
export const WORLD_CENTER = PORT_CENTER;

// Scaling factors for degrees -> world units
// Latitude ~1.25°N: 1 deg lat ~= 110.57 km, 1 deg lng ~= 111.29 km.
export const SCALE_LNG = 3200; // X axis
export const SCALE_LAT = 3200; // Z axis (inverted: lat increase = north = -Z)

export function geoToWorld(lngLat: [number, number], elevation: number = 0): [number, number, number] {
  const [lng, lat] = lngLat;
  const x = (lng - WORLD_CENTER[0]) * SCALE_LNG;
  const z = -(lat - WORLD_CENTER[1]) * SCALE_LAT;
  return [x, elevation, z];
}

export function polygonToWorld(polygon: [number, number][], elevation: number = 0): [number, number, number][] {
  return polygon.map((pt) => geoToWorld(pt, elevation));
}

/**
 * Calculates heading rotation angle in radians for Three.js.
 * Navigational heading: 0° is North (-Z), 90° is East (+X), 180° is South (+Z), 270° is West (-X).
 */
export function headingToRadians(headingDeg: number): number {
  // In Three.js: angle 0 around Y axis points towards +Z (or -Z depending on mesh forward).
  // If mesh forward is +X, angle = -headingDeg * (PI / 180) + PI / 2.
  return -(headingDeg * Math.PI) / 180;
}
