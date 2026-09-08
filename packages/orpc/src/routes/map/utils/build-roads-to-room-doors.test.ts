import { expect, test } from "bun:test"

import type { BuildingScheme } from "@repo/shared/building-scheme"

import { buildRoadsToRoomDoors } from "./build-roads-to-room-doors"

test("moving a floor preserves its local door connections", () => {
	const scheme: BuildingScheme = {
		floors: [
			{
				id: 5,
				name: "2 этаж школы",
				position: { x: 0, y: 0 },
				wallsPosition: [],
				roads: [{ start: { x: 0, y: 0 }, end: { x: 100, y: 0 } }],
			},
		],
		entities: [
			{
				id: 1,
				floorId: 5,
				name: "Room",
				type: "room",
				position: { x: 40, y: 10 },
				wallsPosition: [],
				doorsPosition: [{ x: 10, y: 10 }],
			},
		],
	}
	const original = buildRoadsToRoomDoors(scheme).floors[0].roads
	expect(original).toHaveLength(2)
	expect(original?.[1]).toEqual({
		start: { x: 50, y: 0 },
		end: { x: 50, y: 20 },
	})
	scheme.floors[0].position = { x: 2899, y: -519 }
	expect(buildRoadsToRoomDoors(scheme).floors[0].roads).toEqual(original)
})
