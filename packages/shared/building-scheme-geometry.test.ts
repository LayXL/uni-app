import { describe, expect, test } from "bun:test"

import scheme from "../../scripts/v3.json"
import { buildRoadsToRoomDoors } from "../orpc/src/routes/map/utils/build-roads-to-room-doors"
import type { BuildingScheme, Coordinate, Floor } from "./building-scheme"
import { getFloorContours } from "./building-scheme-geometry"
import { buildingSchemeSchema } from "./building-scheme-schema"

const floor = scheme.floors.find((floor) => floor.id === 1) as Floor

describe("floor cutouts", () => {
	test("offsets both outer walls and holes without changing stored coordinates", () => {
		const moved = { ...floor, position: { x: 300, y: -100 } }
		const contours = getFloorContours(moved)
		expect(contours).toHaveLength(2)
		expect(contours[0][0]).toEqual({ x: 900, y: -100 })
		expect(contours[1][0]).toEqual({ x: 1484, y: 637 })
		expect(floor.holes?.[0][0]).toEqual({ x: 1184, y: 737 })
	})

	test("keeps older floors solid when holes are absent", () => {
		expect(getFloorContours({ ...floor, holes: undefined })).toHaveLength(1)
	})

	test("preserves cutouts when validating an editor publication", () => {
		const parsed = buildingSchemeSchema.parse(scheme)
		expect(parsed.floors.find((f) => f.id === 1)?.holes).toEqual(floor.holes)
		const invalid = {
			...scheme,
			floors: [{ ...floor, holes: [[{ x: 0, y: 0 }]] }],
		}
		expect(buildingSchemeSchema.safeParse(invalid).success).toBe(false)
	})

	test("cuts only the second and third university floors", () => {
		expect(
			scheme.floors.filter((f) => f.holes?.length).map((f) => f.id),
		).toEqual([1, 2])
	})

	for (const id of [1, 2]) {
		test(`floor ${id}: the void avoids rooms, routes, doors and stairs`, () => {
			const data = buildRoadsToRoomDoors(scheme as BuildingScheme)
			const current = data.floors.find((f) => f.id === id)
			const hole = current?.holes?.[0]
			if (!current || !hole) throw new Error(`Missing cutout on floor ${id}`)
			const minX = Math.min(...hole.map((p) => p.x))
			const maxX = Math.max(...hole.map((p) => p.x))
			const minY = Math.min(...hole.map((p) => p.y))
			const maxY = Math.max(...hole.map((p) => p.y))
			const inside = (p: Coordinate) =>
				p.x > minX && p.x < maxX && p.y > minY && p.y < maxY

			for (const room of data.entities) {
				if (room.floorId !== id || room.type !== "room") continue
				const points = room.wallsPosition.map((p) => ({
					x: p.x + room.position.x,
					y: p.y + room.position.y,
				}))
				const overlaps =
					Math.max(...points.map((p) => p.x)) > minX &&
					Math.min(...points.map((p) => p.x)) < maxX &&
					Math.max(...points.map((p) => p.y)) > minY &&
					Math.min(...points.map((p) => p.y)) < maxY
				expect(overlaps, `Room ${room.name}`).toBe(false)
			}

			for (const road of current.roads ?? []) {
				// Clip the segment against the open rectangle, including door links.
				let from = 0
				let to = 1
				for (const [axis, min, max] of [
					["x", minX, maxX],
					["y", minY, maxY],
				] as const) {
					const delta = road.end[axis] - road.start[axis]
					if (delta === 0) {
						if (road.start[axis] <= min || road.start[axis] >= max) to = -1
						continue
					}
					const a = (min - road.start[axis]) / delta
					const b = (max - road.start[axis]) / delta
					from = Math.max(from, Math.min(a, b))
					to = Math.min(to, Math.max(a, b))
				}
				expect(from < to, `Road ${JSON.stringify(road)}`).toBe(false)
			}
			for (const stair of current.stairs ?? []) {
				expect(inside(stair.position), `Stair ${stair.id}`).toBe(false)
			}
		})
	}
})
