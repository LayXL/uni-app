import { describe, expect, test } from "bun:test"

import { getRouteSuggestions } from "./get-route-suggestions"

const lesson = (classroomId?: number) => ({
	classroomId,
	isCancelled: false,
	isDistance: false,
})

describe("route suggestions", () => {
	test("starts at the main entrance and follows today's classrooms", () => {
		expect(
			getRouteSuggestions([lesson(101), lesson(102), lesson(103)]),
		).toEqual([
			{ from: 166, to: 101 },
			{ from: 101, to: 102 },
			{ from: 102, to: 103 },
		])
	})

	test("keeps the previous classroom after repeated rooms and missing rooms", () => {
		expect(
			getRouteSuggestions([
				lesson(),
				lesson(101),
				lesson(101),
				lesson(),
				lesson(102),
				lesson(103),
			]),
		).toEqual([
			{ from: 166, to: 101 },
			{ from: 101, to: 102 },
			{ from: 102, to: 103 },
		])
	})

	test("preserves repeated journeys throughout the day", () => {
		expect(getRouteSuggestions([101, 102, 101, 102, 103].map(lesson))).toEqual([
			{ from: 166, to: 101 },
			{ from: 101, to: 102 },
			{ from: 102, to: 101 },
			{ from: 101, to: 102 },
			{ from: 102, to: 103 },
		])
	})

	test("skips cancelled and remote lessons without changing the starting room", () => {
		expect(
			getRouteSuggestions([
				{ ...lesson(104), isCancelled: true },
				lesson(101),
				{ ...lesson(105), isDistance: true },
				lesson(102),
			]),
		).toEqual([
			{ from: 166, to: 101 },
			{ from: 101, to: 102 },
		])
	})

	test("has no suggestions without an in-person classroom", () => {
		expect(getRouteSuggestions([])).toEqual([])
		expect(getRouteSuggestions([lesson()])).toEqual([])
	})
})
