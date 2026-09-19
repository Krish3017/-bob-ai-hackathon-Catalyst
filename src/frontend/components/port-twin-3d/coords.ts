/**
 * Geographic to Three.js Local World Coordinate Projection & Layout System
 * 
 * Maps Singapore Tuas/Jurong coordinates [lng, lat] from NaviOps data
 * into a centered, scaled Three.js [x, y, z] coordinate system with
 * realistic spatial zoning for berths, cranes, yards, and vessels.
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

// Scaling factors for degrees -> world units (Spacious GIS layout)
export const SCALE_LNG = 4000; // X axis
export const SCALE_LAT = 4000; // Z axis (inverted: lat increase = north = -Z)

// ---------------------------------------------------------------------------
// SPATIAL LAYOUT CONSTANTS (Clean Port Zoning)
// ---------------------------------------------------------------------------
// Quay angle: Quay wall runs at angle -0.34 rad (-19.5°)
export const QUAY_ANGLE = -0.34;

// Seaward unit normal vector (perpendicular to quay wall pointing into the water)
export const SEAWARD_VECTOR: [number, number, number] = [
  Math.cos(QUAY_ANGLE + Math.PI / 2),
  0,
  -Math.sin(QUAY_ANGLE + Math.PI / 2),
]; // roughly [0.334, 0, 0.943]

// Distance from quay edge to vessel center when berthed (generous water clearance)
export const BERTHED_VESSEL_SEAWARD_OFFSET = 6.0;

// Distance from quay edge to crane rail center (inland quayside apron)
export const CRANE_RAIL_INLAND_OFFSET = 1.2;

// Base elevation constants
export const ELEVATION_WATER = 0.0;
export const ELEVATION_QUAY = 0.36;
export const ELEVATION_YARD = 0.38;

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
  return -(headingDeg * Math.PI) / 180;
}

/**
 * Calculates the realistic world position for a vessel alongside a berth in the water.
 */
export function getBerthedVesselPosition(berthCoords: [number, number]): [number, number, number] {
  const [bx, , bz] = geoToWorld(berthCoords, ELEVATION_WATER);
  const vx = bx + SEAWARD_VECTOR[0] * BERTHED_VESSEL_SEAWARD_OFFSET;
  const vz = bz + SEAWARD_VECTOR[2] * BERTHED_VESSEL_SEAWARD_OFFSET;
  return [vx, 0.08, vz];
}

/**
 * Calculates the realistic world position for a quay crane on the apron rail.
 */
export function getQuayCranePosition(craneCoords: [number, number]): [number, number, number] {
  const [cx, , cz] = geoToWorld(craneCoords, ELEVATION_QUAY);
  const rx = cx - SEAWARD_VECTOR[0] * CRANE_RAIL_INLAND_OFFSET;
  const rz = cz - SEAWARD_VECTOR[2] * CRANE_RAIL_INLAND_OFFSET;
  return [rx, ELEVATION_QUAY, rz];
}
