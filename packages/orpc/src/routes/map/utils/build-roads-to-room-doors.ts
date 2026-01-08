import type {
	BuildingScheme,
	Coordinate,
	Road,
	Room,
} from "@repo/shared/building-scheme"
import { isRoom } from "@repo/shared/building-scheme"

import { type ProjectionResult, projectPointToSegment } from "./geometry"

export const DOOR_TO_ROAD_RADIUS = 120

export function buildRoadsToRoomDoors(
	buildingScheme: BuildingScheme,
): BuildingScheme {
	const floorsWithExtraRoads = buildingScheme.floors.map((floor) => {
		const baseRoads = floor.roads ?? []
		const floorRooms = buildingScheme.entities.filter(
			(e): e is Room => isRoom(e) && e.floorId === floor.id,
		)

		if (!floorRooms.length || baseRoads.length === 0) return floor

		const extraRoads: Road[] = []

		floorRooms.forEach((room) => {
			room.doorsPosition?.forEach((door) => {
				const doorGlobal: Coordinate = {
					x: floor.position.x + room.position.x + door.x,
					y: floor.position.y + room.position.y + door.y,
				}

				let closest: ProjectionResult | null = null

				for (const road of baseRoads) {
					const projected = projectPointToSegment(
						doorGlobal,
						road.start,
						road.end,
					)
					if (!projected) continue

					if (
						projected.distance <= DOOR_TO_ROAD_RADIUS &&
						(closest === null || projected.distance < closest.distance)
					) {
						closest = projected
					}
				}

				if (closest === null || closest.distance < 1e-3) return

				extraRoads.push({
					start: closest.projection,
					end: doorGlobal,
				})
			})
		})

		if (extraRoads.length === 0) return floor

		return { ...floor, roads: [...baseRoads, ...extraRoads] }
	})

	return {
		floors: floorsWithExtraRoads,
		entities: buildingScheme.entities,
	}
}
