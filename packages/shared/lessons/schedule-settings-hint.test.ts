import { describe, expect, test } from "bun:test"

import { shouldShowScheduleSettingsHint } from "./schedule-settings-hint"

describe("schedule settings hint", () => {
	test("starts on the second session and stays eligible until acknowledged", () => {
		const settings = { dismissed: false, forced: false }
		expect(shouldShowScheduleSettingsHint({ ...settings, visitCount: 0 })).toBe(
			false,
		)
		expect(shouldShowScheduleSettingsHint({ ...settings, visitCount: 1 })).toBe(
			false,
		)
		expect(shouldShowScheduleSettingsHint({ ...settings, visitCount: 2 })).toBe(
			true,
		)
		expect(shouldShowScheduleSettingsHint({ ...settings, visitCount: 5 })).toBe(
			true,
		)
	})
	test("acknowledgement prevents repeated hints in later sessions", () => {
		expect(
			shouldShowScheduleSettingsHint({
				visitCount: 2,
				dismissed: true,
				forced: false,
			}),
		).toBe(false)
		expect(
			shouldShowScheduleSettingsHint({
				visitCount: 10,
				dismissed: true,
				forced: false,
			}),
		).toBe(false)
	})
	test("admin reset can show the hint immediately, including in the first session", () => {
		expect(
			shouldShowScheduleSettingsHint({
				visitCount: 1,
				dismissed: false,
				forced: true,
			}),
		).toBe(true)
		expect(
			shouldShowScheduleSettingsHint({
				visitCount: 1,
				dismissed: true,
				forced: true,
			}),
		).toBe(false)
	})
})
