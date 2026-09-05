import type {
	Coordinate,
	Floor,
	MapEntity,
	Room,
} from "@repo/shared/building-scheme"
import { isRoom } from "@repo/shared/building-scheme"

export type IndoorRoutePoint = Coordinate & {
	floor: number
	type: "road" | "stairs"
	toFloor?: number | null
}

export const roomPoints = (room: Room, floor: Floor): Coordinate[] =>
	room.wallsPosition.map((p) => ({
		x: p.x + room.position.x + floor.position.x,
		y: p.y + room.position.y + floor.position.y,
	}))

export const entityCenter = (entity: MapEntity, floor: Floor): Coordinate => {
	const points = isRoom(entity) ? roomPoints(entity, floor) : []
	if (!points.length)
		return {
			x: entity.position.x + floor.position.x,
			y: entity.position.y + floor.position.y,
		}
	return {
		x:
			(Math.min(...points.map((p) => p.x)) +
				Math.max(...points.map((p) => p.x))) /
			2,
		y:
			(Math.min(...points.map((p) => p.y)) +
				Math.max(...points.map((p) => p.y))) /
			2,
	}
}

/** Split each edge at projected doors, including doors stored slightly off the wall. */
export const wallSegments = (
	points: Coordinate[],
	doors: Coordinate[] = [],
	doorWidth = 36,
) => {
	const segments: { start: Coordinate; end: Coordinate }[] = []
	for (let i = 0; i < points.length; i++) {
		const start = points[i]
		const end = points[(i + 1) % points.length]
		const dx = end.x - start.x
		const dy = end.y - start.y
		const length = Math.hypot(dx, dy)
		if (length < 0.01) continue
		const gaps = doors
			.flatMap((door) => {
				const along =
					((door.x - start.x) * dx + (door.y - start.y) * dy) / length
				const distance =
					Math.abs((door.x - start.x) * dy - (door.y - start.y) * dx) / length
				return distance <= 12 && along >= 0 && along <= length
					? [
							[
								Math.max(0, along - doorWidth / 2),
								Math.min(length, along + doorWidth / 2),
							],
						]
					: []
			})
			.sort((a, b) => a[0] - b[0])
		const at = (distance: number) => ({
			x: start.x + (dx * distance) / length,
			y: start.y + (dy * distance) / length,
		})
		let cursor = 0
		for (const [from, to] of [...gaps, [length, length]]) {
			if (from > cursor) segments.push({ start: at(cursor), end: at(from) })
			cursor = Math.max(cursor, to)
		}
	}
	return segments
}

/** Never join separate visits to a floor across an intervening floor. */
export const floorRouteChains = (route: IndoorRoutePoint[], floor: Floor) => {
	const chains: Coordinate[][] = []
	let chain: Coordinate[] = []
	for (const point of route) {
		if (point.floor === floor.id) {
			chain.push({
				x: point.x + floor.position.x,
				y: point.y + floor.position.y,
			})
		} else if (chain.length) {
			chains.push(chain)
			chain = []
		}
	}
	if (chain.length) chains.push(chain)
	return chains
}
