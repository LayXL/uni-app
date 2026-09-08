import type {
	BuildingScheme,
	Coordinate,
	Floor,
} from "@repo/shared/building-scheme"

import type { IndoorRoutePoint } from "./indoor-geometry"

export const floorLevel = (floor: Floor) =>
	Number.parseFloat((floor.acronym ?? floor.name).replace(",", "."))
export const isSchool = (floor: Floor) => /школ/i.test(floor.name)
export const levelFloors = (data: BuildingScheme, floorId: number) => {
	const active = data.floors.find((floor) => floor.id === floorId)
	return active
		? data.floors.filter((floor) => floorLevel(floor) === floorLevel(active))
		: []
}

/** Keep source IDs and local coordinates so search and server routes still agree. */
export const layoutCampuses = (data: BuildingScheme): BuildingScheme => {
	const university = data.floors.find(
		(f) => !isSchool(f) && floorLevel(f) === 2,
	)
	const school = data.floors.find((f) => isSchool(f) && floorLevel(f) === 2)
	if (!university || !school) return data
	const entrance = university.stairs?.find((s) => s.floors.includes(school.id))
	const exit = school.stairs?.find((s) => s.id === entrance?.id)
	if (!entrance || !exit) return data
	const position = {
		x:
			university.position.x +
			Math.max(...university.wallsPosition.map((p) => p.x)) -
			Math.min(...school.wallsPosition.map((p) => p.x)),
		y: university.position.y + entrance.position.y - exit.position.y,
	}
	return {
		...data,
		floors: data.floors.map((floor) =>
			isSchool(floor) ? { ...floor, position } : floor,
		),
	}
}

/** A temporary level in world coordinates, used only by the renderers. */
export const renderLevel = (data: BuildingScheme, floorId: number) => {
	const parts = levelFloors(data, floorId)
	const ids = new Set(parts.map((f) => f.id))
	const world = (p: Coordinate, f: Floor) => ({
		x: p.x + f.position.x,
		y: p.y + f.position.y,
	})
	const source = parts.find((f) => f.id === floorId)
	if (!source) return { data, parts }
	const floor: Floor = {
		...source,
		position: { x: 0, y: 0 },
		wallsPosition: source.wallsPosition.map((p) => world(p, source)),
		holes: source.holes?.map((hole) => hole.map((p) => world(p, source))),
		stairs: parts.flatMap((part) =>
			(part.stairs ?? [])
				.filter((s) => !s.floors.some((id) => ids.has(id) && id !== part.id))
				.map((s) => ({ ...s, position: world(s.position, part) })),
		),
		roads: parts.flatMap((part) =>
			(part.roads ?? []).map((r) => ({
				start: world(r.start, part),
				end: world(r.end, part),
			})),
		),
	}
	return {
		parts,
		data: {
			floors: data.floors.map((f) => (f.id === floorId ? floor : f)),
			entities: data.entities.map((entity) => {
				const part = parts.find((f) => f.id === entity.floorId)
				return part
					? { ...entity, floorId, position: world(entity.position, part) }
					: entity
			}),
		},
	}
}

export const renderLevelRoute = (
	data: BuildingScheme,
	floorId: number,
	route: IndoorRoutePoint[],
) => {
	const parts = levelFloors(data, floorId)
	const ids = new Set(parts.map((f) => f.id))
	return route.map((point) => {
		const part = parts.find((f) => f.id === point.floor)
		if (!part) return point
		const sameLevel = point.toFloor != null && ids.has(point.toFloor)
		return {
			...point,
			x: point.x + part.position.x,
			y: point.y + part.position.y,
			floor: floorId,
			...(sameLevel ? { type: "road" as const, toFloor: null } : {}),
		}
	})
}
