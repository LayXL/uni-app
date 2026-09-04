import type { Floor } from "./building-scheme"

/** Outer boundary and cutouts, in global coordinates, for even-odd filling. */
export const getFloorContours = (floor: Floor) =>
	[floor.wallsPosition, ...(floor.holes ?? [])].map((contour) =>
		contour.map((point) => ({
			x: point.x + floor.position.x,
			y: point.y + floor.position.y,
		})),
	)
