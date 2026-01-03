import type { Coordinate } from "@repo/shared/building-scheme"

export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

export type ProjectionResult = { projection: Coordinate; distance: number }

export const projectPointToSegment = (
	point: Coordinate,
	start: Coordinate,
	end: Coordinate,
): ProjectionResult | null => {
	const abX = end.x - start.x
	const abY = end.y - start.y

	const lengthSquared = abX * abX + abY * abY
	if (lengthSquared === 0) return null

	const t = clamp01(
		((point.x - start.x) * abX + (point.y - start.y) * abY) / lengthSquared,
	)

	const projection: Coordinate = {
		x: start.x + abX * t,
		y: start.y + abY * t,
	}

	const distance = Math.hypot(point.x - projection.x, point.y - projection.y)

	return { projection, distance }
}
