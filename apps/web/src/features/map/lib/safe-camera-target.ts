import type { Coordinate } from "@repo/shared/building-scheme"

export type CameraBounds = {
	minX: number
	maxX: number
	minY: number
	maxY: number
}

/** Allow a little space around the level, moving only as far as necessary. */
export const safeCameraTarget = (target: Coordinate, bounds: CameraBounds) => ({
	x: Math.max(bounds.minX - 200, Math.min(bounds.maxX + 200, target.x)),
	y: Math.max(bounds.minY - 200, Math.min(bounds.maxY + 200, target.y)),
})
