import assert from "node:assert/strict"
import { test } from "node:test"

import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { mergeConsecutiveLessons } from "./merge-consecutive-lessons"

const lesson = (order: number, overrides: Partial<Lesson> = {}): Lesson => ({
	date: "2026-09-05",
	order,
	classroom: "334",
	classroomId: 334,
	isCancelled: false,
	isChanged: false,
	isDistance: false,
	original: null,
	subject: { id: 1, name: "Рисунок" },
	groups: [{ id: 10, displayName: "Преподаватель", type: "teacher" }],
	startTime: "08:00",
	endTime: "09:35",
	...overrides,
})

test("merges a run and preserves every time interval without mutating lessons", () => {
	const lessons = [
		lesson(1),
		lesson(2, { startTime: "09:45", endTime: "11:20" }),
		lesson(3),
	]
	const original = structuredClone(lessons)
	assert.deepEqual(mergeConsecutiveLessons(lessons), [lessons])
	assert.deepEqual(lessons, original)
})

test("keeps gaps and different days, subjects, rooms, teachers and statuses separate", () => {
	for (const overrides of [
		{ order: 3 },
		{ date: "2026-09-06" },
		{ subject: { id: 2, name: "Живопись" } },
		{ classroom: "335" },
		{ classroomId: 335 },
		{
			groups: [
				{
					id: 11,
					displayName: "Другой преподаватель",
					type: "teacher" as const,
				},
			],
		},
		{ groups: [] },
		{ isDistance: true },
		{ isCancelled: true },
	]) {
		const lessons = [lesson(1), lesson(2, overrides)]
		assert.deepEqual(
			mergeConsecutiveLessons(lessons),
			lessons.map((item) => [item]),
		)
	}
})

test("does not merge through an intervening lesson", () => {
	const lessons = [
		lesson(1),
		lesson(2, { classroom: "335" }),
		lesson(3),
		lesson(4),
	]
	assert.deepEqual(mergeConsecutiveLessons(lessons), [
		[lessons[0]],
		[lessons[1]],
		lessons.slice(2),
	])
})

test("matches teacher sets regardless of order and handles an empty schedule", () => {
	const teachers = [
		...lesson(1).groups,
		{ id: 11, displayName: "Второй", type: "teacher" as const },
	]
	const lessons = [
		lesson(1, { groups: teachers }),
		lesson(2, { groups: teachers.toReversed() }),
	]
	assert.deepEqual(mergeConsecutiveLessons(lessons), [lessons])
	assert.deepEqual(mergeConsecutiveLessons([]), [])
})
