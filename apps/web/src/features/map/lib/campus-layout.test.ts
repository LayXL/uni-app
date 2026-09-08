import { describe, expect, test } from "bun:test"

import type { BuildingScheme } from "@repo/shared/building-scheme"

import scheme from "../../../../../../scripts/v3.json"
import {
	layoutCampuses,
	levelFloors,
	renderLevel,
	renderLevelRoute,
} from "./campus-layout"
import { floorRouteChains } from "./indoor-geometry"
import { createIndoorLevel, disposeIndoorGroup } from "./indoor-model"

const source = scheme as BuildingScheme
const data = layoutCampuses(source)

describe("combined campus levels", () => {
	test("only the second floor touches; school remains on the right", () => {
		for (const id of [0, 1, 2]) {
			const [university, school] = levelFloors(data, id)
			const right = Math.max(
				...university.wallsPosition.map((p) => p.x + university.position.x),
			)
			const left = Math.min(
				...school.wallsPosition.map((p) => p.x + school.position.x),
			)
			if (id === 1) expect(left).toBe(right)
			else expect(left).toBeGreaterThan(right)
		}
		expect(levelFloors(data, 3)).toHaveLength(1)
		expect(levelFloors(data, 7)).toHaveLength(1)
		expect(layoutCampuses(data)).toEqual(data)
		expect(source.floors.find((f) => f.id === 5)?.position).toEqual({
			x: 0,
			y: 0,
		})
	})
	test("both campuses have selectable rooms and no passage buttons", () => {
		const floor = data.floors.find((f) => f.id === 1)
		if (!floor) throw new Error("Missing second floor fixture")
		const model = createIndoorLevel(data, floor, "light")
		for (const entity of data.entities.filter(
			(e) => [1, 5].includes(e.floorId) && e.type === "room",
		))
			expect(model.rooms.has(entity.id)).toBe(true)
		expect(
			model.labels.some((l) => l.text === "В школу" || l.text === "В МИДИС"),
		).toBe(false)
		disposeIndoorGroup(model.group)
	})
	test("route crosses the passage continuously but preserves visits to other levels", () => {
		const route = renderLevelRoute(data, 1, [
			{ floor: 1, x: 2739, y: 391, type: "stairs", toFloor: 5 },
			{ floor: 5, x: -40, y: 910, type: "stairs", toFloor: 1 },
			{ floor: 5, x: 260, y: 1070, type: "stairs", toFloor: 4 },
			{ floor: 4, x: 260, y: 1070, type: "stairs", toFloor: 5 },
			{ floor: 5, x: 260, y: 1070, type: "stairs", toFloor: 4 },
		])
		const level = renderLevel(data, 1).data.floors.find((f) => f.id === 1)
		if (!level) throw new Error("Missing combined second floor")
		const chains = floorRouteChains(route, level)
		expect(chains.map((c) => c.length)).toEqual([3, 1])
		expect(chains[0][0].y).toBe(chains[0][1].y)
		expect(route[0].toFloor).toBeNull()
		expect(route[2].toFloor).toBe(4)
	})
})
