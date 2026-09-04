import { describe, expect, test } from "bun:test"
import { Cron } from "croner"

import {
	getParsingTimeRemaining,
	PARSING_CRON,
	PARSING_TIMEZONE,
} from "./parsing-window"

describe("schedule parsing window", () => {
	test.each([
		["2026-09-04T04:59:59.999+05:00", 0],
		["2026-09-04T05:00:00+05:00", 14 * 60 * 60 * 1000],
		["2026-09-04T18:59:59.999+05:00", 1],
		["2026-09-04T19:00:00+05:00", 0],
		["2026-09-04T23:00:00+05:00", 0],
		["2026-09-05T00:00:00+05:00", 0],
		["2026-09-04T03:00:00+03:00", 14 * 60 * 60 * 1000],
		["2026-09-04T14:00:00Z", 0],
	])("calculates the cutoff using Yekaterinburg time: %s", (date, remaining) => {
		expect(getParsingTimeRemaining(new Date(date))).toBe(remaining)
	})

	test("runs hourly from 05:00 through 18:00, then waits until the next morning", () => {
		const cron = new Cron(PARSING_CRON, {
			timezone: PARSING_TIMEZONE,
			paused: true,
		})
		try {
			const runs = cron.nextRuns(15, new Date("2026-09-04T04:59:59+05:00"))
			expect(runs.map((date) => date.toISOString())).toEqual([
				...Array.from({ length: 14 }, (_, hour) =>
					new Date(Date.UTC(2026, 8, 4, hour)).toISOString(),
				),
				"2026-09-05T00:00:00.000Z",
			])
		} finally {
			cron.stop()
		}
	})
})
