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
	if (isRoom(entity) && entity.labelPosition)
		return {
			x: entity.labelPosition.x + entity.position.x + floor.position.x,
			y: entity.labelPosition.y + entity.position.y + floor.position.y,
		}
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

/** Round only the immediate corner; keep endpoints and most of each edge intact. */
export const roundRouteCorners = (
	points: Coordinate[],
	radius = 14,
): Coordinate[] => {
	const chain = points.filter(
		(point, index) =>
			index === 0 ||
			Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) >
				0.01,
	)
	if (chain.length < 3) return chain
	const rounded = [chain[0]]
	for (let i = 1; i < chain.length - 1; i++) {
		const a = chain[i - 1]
		const b = chain[i]
		const c = chain[i + 1]
		const incoming = Math.hypot(b.x - a.x, b.y - a.y)
		const outgoing = Math.hypot(c.x - b.x, c.y - b.y)
		const turn =
			((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)) /
			(incoming * outgoing)
		if (Math.abs(turn) < 0.01) {
			rounded.push(b)
			continue
		}
		const trim = Math.min(radius, incoming * 0.2, outgoing * 0.2)
		const start = {
			x: b.x + ((a.x - b.x) * trim) / incoming,
			y: b.y + ((a.y - b.y) * trim) / incoming,
		}
		const end = {
			x: b.x + ((c.x - b.x) * trim) / outgoing,
			y: b.y + ((c.y - b.y) * trim) / outgoing,
		}
		for (let step = 0; step <= 6; step++) {
			const t = step / 6
			const u = 1 - t
			rounded.push({
				x: u * u * start.x + 2 * u * t * b.x + t * t * end.x,
				y: u * u * start.y + 2 * u * t * b.y + t * t * end.y,
			})
		}
	}
	rounded.push(chain[chain.length - 1])
	return rounded
}
