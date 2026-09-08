import { expect, test } from "bun:test"

import { safeCameraTarget } from "./safe-camera-target"

const bounds = { minX: 100, maxX: 1000, minY: 300, maxY: 2000 }

test("keeps targets inside the level and its safety margin unchanged", () => {
	for (const target of [
		{ x: 500, y: 800 },
		{ x: -100, y: 2200 },
	]) {
		expect(safeCameraTarget(target, bounds)).toEqual(target)
	}
})

test("moves a distant target only to the nearest safe edge", () => {
	expect(safeCameraTarget({ x: 5000, y: 800 }, bounds)).toEqual({
		x: 1200,
		y: 800,
	})
	expect(safeCameraTarget({ x: -900, y: 9000 }, bounds)).toEqual({
		x: -100,
		y: 2200,
	})
})
