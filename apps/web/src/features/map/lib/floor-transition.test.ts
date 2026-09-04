import { describe, expect, test } from "bun:test"

import scheme from "../../../../../../scripts/v3.json"
import { getFloorTransition } from "./floor-transition"

describe("floor transition direction", () => {
	test("treats the university as left and the school as right", () => {
		for (const university of [0, 1, 3, 2, 7]) {
			for (const school of [4, 5, 6]) {
				expect(getFloorTransition(scheme.floors, university, school)).toEqual({
					kind: "slide",
					fromPage: "1",
					toPage: "2",
				})
				expect(getFloorTransition(scheme.floors, school, university)).toEqual({
					kind: "slide",
					fromPage: "2",
					toPage: "1",
				})
			}
		}
	})

	test("uses floor levels, not IDs, including the 2.5 floor", () => {
		for (const [lower, upper] of [
			[0, 1],
			[1, 3],
			[3, 2],
			[2, 7],
			[4, 5],
			[5, 6],
		]) {
			expect(getFloorTransition(scheme.floors, lower, upper)?.kind).toBe(
				"zoom-in",
			)
			expect(getFloorTransition(scheme.floors, upper, lower)?.kind).toBe(
				"zoom-out",
			)
		}
	})

	test("does not animate the same or missing floor", () => {
		expect(getFloorTransition(scheme.floors, 0, 0)).toBeNull()
		expect(getFloorTransition(scheme.floors, 0, 999)).toBeNull()
		expect(getFloorTransition(scheme.floors, 999, 1)).toBeNull()
	})
})
