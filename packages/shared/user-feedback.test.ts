import { describe, expect, test } from "bun:test"

import {
	normalizeUserFeedbackReasons,
	shouldShowUserFeedbackPrompt,
} from "./user-feedback"

describe("shouldShowUserFeedbackPrompt", () => {
	test("shows the prompt only on the second visit", () => {
		expect(shouldShowUserFeedbackPrompt({ visitCount: 2 })).toBe(true)
		expect(shouldShowUserFeedbackPrompt({ visitCount: 1 })).toBe(false)
		expect(shouldShowUserFeedbackPrompt({ visitCount: 3 })).toBe(false)
	})
})

describe("normalizeUserFeedbackReasons", () => {
	test("keeps reasons for ratings up to three", () => {
		expect(normalizeUserFeedbackReasons(3, ["map_issues"])).toEqual([
			"map_issues",
		])
	})

	test("removes reasons from positive ratings", () => {
		expect(normalizeUserFeedbackReasons(4, ["map_issues"])).toEqual([])
	})
})
