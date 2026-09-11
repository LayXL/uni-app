import { describe, expect, test } from "bun:test"

import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import {
	getAdjacentDate,
	getDayDragOffset,
	getSwipeDayOffset,
} from "./day-navigation"

describe("day navigation", () => {
	test("tracks the pointer directly and resists dragging beyond the first or last day", () => {
		expect(getDayDragOffset(-24, 390, true, true)).toBe(-24)
		expect(getDayDragOffset(24, 390, true, true)).toBe(24)
		expect(getDayDragOffset(100, 390, false, true)).toBe(20)
		expect(getDayDragOffset(-100, 390, true, false)).toBe(-20)
		expect(getDayDragOffset(-600, 390, true, true)).toBe(-390)
	})
	test("horizontal swipes change the day, taps and vertical scrolling do not", () => {
		expect(getSwipeDayOffset(-100, 10)).toBe(1)
		expect(getSwipeDayOffset(100, 10)).toBe(-1)
		expect(getSwipeDayOffset(10, 0)).toBe(0)
		expect(getSwipeDayOffset(50, 100)).toBe(0)
		expect(getSwipeDayOffset(60, 50)).toBe(0)
	})
	test("skips Sundays across a month boundary and stays within the available range", () => {
		const dates = getNextTwoWeeksDates({
			now: new Date("2026-01-31T12:00:00Z"),
		})
		expect(dates).not.toContain("2026-02-01")
		expect(getAdjacentDate(dates, "2026-01-31", 1)).toBe("2026-02-02")
		expect(getAdjacentDate(dates, "2026-02-02", -1)).toBe("2026-01-31")
		expect(getAdjacentDate(dates, "2026-01-31", -1)).toBe(dates[0])
		const last = dates.at(-1) ?? ""
		expect(getAdjacentDate(dates, last, 1)).toBe(last)
		expect(getAdjacentDate(dates, "2026-01-30", 1)).toBe(dates[0])
	})
	test("starts on Monday when today is Sunday", () => {
		const dates = getNextTwoWeeksDates({
			now: new Date("2026-02-01T12:00:00Z"),
		})
		expect(dates[0]).toBe("2026-02-02")
	})
})
