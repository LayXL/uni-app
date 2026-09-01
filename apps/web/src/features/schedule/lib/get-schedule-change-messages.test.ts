import assert from "node:assert/strict"
import { describe, test } from "node:test"

import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { getScheduleChangeMessages } from "./get-schedule-change-messages"

const createLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
	date: "2026-09-01",
	order: 1,
	classroom: "334",
	isCancelled: false,
	isDistance: false,
	isChanged: false,
	original: null,
	subject: { id: 39, name: "Специальный рисунок" },
	groups: [],
	startTime: "08:00",
	endTime: "09:35",
	...overrides,
})

describe("getScheduleChangeMessages", () => {
	test("does not describe unchanged lessons", () => {
		assert.deepEqual(getScheduleChangeMessages([createLesson()]), [])
	})

	test("describes a classroom change", () => {
		const lesson = createLesson({
			isChanged: true,
			classroom: "206",
			original: { classroom: "334" },
		})

		assert.deepEqual(getScheduleChangeMessages([lesson]), [
			"У 1 пары поменялся кабинет с 334 на 206",
		])
	})

	test("describes a subject change", () => {
		const lesson = createLesson({
			isChanged: true,
			original: { subject: "Основы композиции" },
		})

		assert.deepEqual(getScheduleChangeMessages([lesson]), [
			"Вместо «Основы композиции» будет «Специальный рисунок» 1 парой",
		])
	})

	test("describes subject and classroom changes together", () => {
		const lesson = createLesson({
			isChanged: true,
			classroom: "206",
			original: {
				subject: "Основы композиции",
				classroom: "334",
			},
		})

		assert.deepEqual(getScheduleChangeMessages([lesson]), [
			"Вместо «Основы композиции» будет «Специальный рисунок» 1 парой",
			"У 1 пары поменялся кабинет с 334 на 206",
		])
	})

	test("collects changes from several lessons", () => {
		const lessons = [
			createLesson({
				isChanged: true,
				classroom: "206",
				original: { classroom: "334" },
			}),
			createLesson({
				order: 3,
				isChanged: true,
				subject: { id: 40, name: "Живопись" },
				original: { subject: "Черчение" },
			}),
		]

		assert.deepEqual(getScheduleChangeMessages(lessons), [
			"У 1 пары поменялся кабинет с 334 на 206",
			"Вместо «Черчение» будет «Живопись» 3 парой",
		])
	})

	test("does not show a classroom for a remote lesson", () => {
		const lesson = createLesson({
			isChanged: true,
			isDistance: true,
			classroom: "дистант",
			original: { classroom: "334", isDistance: false },
		})

		assert.deepEqual(getScheduleChangeMessages([lesson]), [
			"1 пара пройдёт дистанционно",
		])
	})

	test("describes a cancelled lesson without a classroom change", () => {
		const lesson = createLesson({
			isChanged: true,
			isCancelled: true,
			classroom: "отменено",
			original: { classroom: "334", isCancelled: false },
		})

		assert.deepEqual(getScheduleChangeMessages([lesson]), ["1 пара отменена"])
	})
})
