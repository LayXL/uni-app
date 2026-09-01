import { describe, expect, test } from "bun:test"

import { normalizeClassroomName } from "./normalize-classroom-name"

describe("normalizeClassroomName", () => {
	test.each([
		"305Aкт",
		"305Акт",
		" 305AКТ ",
	])("maps %s to the assembly hall", (classroom) => {
		expect(normalizeClassroomName(classroom)).toBe("Актовый зал")
	})

	test("keeps other classroom names unchanged", () => {
		expect(normalizeClassroomName("305")).toBe("305")
	})
})
