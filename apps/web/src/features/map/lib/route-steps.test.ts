import { describe, expect, test } from "bun:test"

import type { BuildingScheme } from "@repo/shared/building-scheme"

import scheme from "../../../../../../scripts/v3.json"
import { buildSteps } from "./route-steps"

const data = scheme as BuildingScheme
const road = (floor: number, x: number) => ({
	floor,
	x,
	y: 10,
	type: "road" as const,
})
const stairs = (floor: number, toFloor: number, x: number) => ({
	...road(floor, x),
	type: "stairs" as const,
	toFloor,
})

describe("route instructions", () => {
	for (const [floor, instruction] of [
		[4, "спустись на\u00a01\u00a0этаж"],
		[6, "поднимись на\u00a03\u00a0этаж"],
	] as const) {
		test(`combines the school passage with ${instruction}`, () => {
			const steps = buildSteps(
				[
					road(1, 0),
					stairs(1, 5, 20),
					road(5, 30),
					road(5, 40),
					stairs(5, floor, 50),
					road(floor, 60),
					road(floor, 70),
				],
				data,
			)
			expect(steps).toEqual([
				{
					title: `Перейди в\u00a0школу через\u00a0переход и\u00a0${instruction}`,
					x: 0,
					y: 10,
					floor: 1,
				},
				{ title: "Дойди до\u00a0точки", x: 60, y: 10, floor },
			])
		})
	}

	test("keeps the passage when the destination is on the second school floor", () => {
		expect(
			buildSteps([stairs(1, 5, 20), road(5, 30)], data).map((s) => s.title),
		).toEqual([
			"Перейди в\u00a0школу через\u00a0переход",
			"Дойди до\u00a0точки",
		])
	})

	test("preserves the preceding floor change and the final school coordinates", () => {
		const steps = buildSteps(
			[
				stairs(0, 1, 0),
				road(1, 10),
				stairs(1, 5, 20),
				road(5, 30),
				stairs(5, 6, 40),
				road(6, 50),
			],
			data,
		)
		expect(steps.map((s) => s.title)).toEqual([
			"Поднимись на\u00a02\u00a0этаж",
			"Перейди в\u00a0школу через\u00a0переход и\u00a0поднимись на\u00a03\u00a0этаж",
			"Дойди до\u00a0точки",
		])
		expect(steps.map((s) => [s.floor, s.x])).toEqual([
			[0, 0],
			[1, 10],
			[6, 50],
		])
	})

	test("preserves the return passage and ordinary stairs", () => {
		expect(
			buildSteps(
				[stairs(5, 1, 0), road(1, 10), stairs(1, 2, 20), road(2, 30)],
				data,
			).map((s) => s.title),
		).toEqual([
			"Перейди в\u00a0МИДИС через\u00a0переход",
			"Поднимись на\u00a03\u00a0этаж",
			"Дойди до\u00a0точки",
		])
	})

	test("has no instructions for an empty route", () => {
		expect(buildSteps([], data)).toEqual([])
	})
})
