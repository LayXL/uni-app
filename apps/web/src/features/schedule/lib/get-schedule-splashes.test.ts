import assert from "node:assert/strict"
import { describe, test } from "node:test"

import type { Lesson } from "@repo/shared/lessons/types/lesson"

import {
	generalScheduleSplashes,
	getScheduleSplashes,
	type SplashGroup,
} from "./get-schedule-splashes"

const group: SplashGroup = {
	id: 1,
	displayName: "П-201",
	type: "studentsGroup",
}
const lesson = (overrides: Partial<Lesson> = {}): Lesson => ({
	date: "2026-09-04",
	order: 1,
	classroom: "334",
	isCancelled: false,
	isDistance: false,
	isChanged: false,
	original: null,
	subject: { id: 1, name: "Математика" },
	groups: [],
	startTime: "08:00",
	endTime: "09:30",
	...overrides,
})
const get = (schedule?: Lesson[], time = "07:00", userGroup = group) =>
	getScheduleSplashes({
		group: userGroup,
		schedule,
		now: new Date(`2026-09-04T${time}:00`),
	})

describe("schedule splash candidates", () => {
	test("keeps the original phrases and all additions lowercase and unique", () => {
		assert.deepEqual(generalScheduleSplashes.slice(0, 8), [
			"квест: не проспать",
			"спавн у первой пары",
			"сохраниться перед парой?",
			"сон временно недоступен",
			"твой лут — конспекты",
			"ещё пять минуточек?",
			"загружаем режим студента",
			"проверим, куда бежать?",
		])
		assert.equal(generalScheduleSplashes.length, 102)
		assert.equal(
			new Set(generalScheduleSplashes).size,
			generalScheduleSplashes.length,
		)
		for (const phrase of generalScheduleSplashes) {
			assert.equal(phrase, phrase.toLowerCase())
			assert(!phrase.includes("&#x20;"))
		}
		assert(generalScheduleSplashes.includes("console.log(2+2)"))
		assert(generalScheduleSplashes.includes("мяу"))
		assert(generalScheduleSplashes.includes("завтра семь пар! испугался?"))
	})

	test("includes the latest requested general splashes verbatim", () => {
		assert.deepEqual(generalScheduleSplashes.slice(76), [
			"ты зашёл. я растерялось",
			"староста печатает…",
			"я не списываю. я синхронизируюсь",
			"пропускать нельзя присутствовать",
			"пары — это сезонный контент",
			"здесь могла быть мотивация",
			"план надёжный. деталей нет",
			"ничего не трогай. работает",
			"ты это тоже видишь?",
			"я просто показываю пары",
			"не спрашивай откуда я знаю",
			"здесь безопасно. наверное",
			"так было задумано кафедрой",
			"одногруппник покинул сервер",
			"неосознанный динозавр",
			"неопознанный енот",
			"промпт сдан вместо курсовой",
			"гг вп!",
			"скачать мод на деньги без смс",
			"скачать мод на сбербанк бесплатно",
			"motherlode",
			"motherlode не сработал",
			"я обманываю",
			"сикс севен",
			"кто-то уже пишет диплом. ужас",
			"увидел чужой github. день испорчен",
		])
	})

	test("offers saving before Monday only on Sundays, even without schedule data", () => {
		for (let day = 6; day <= 12; day += 1) {
			for (const schedule of [undefined, []]) {
				const now = new Date(2026, 8, day, 18)
				const phrases = getScheduleSplashes({ group, schedule, now })
				assert.equal(
					phrases.includes("сохранение перед понедельником"),
					now.getDay() === 0,
				)
			}
		}
		assert(
			!(generalScheduleSplashes as readonly string[]).includes(
				"сохранение перед понедельником",
			),
		)
	})

	for (const [displayName, course, expected] of [
		["П-101", 1, "первый курс? добро пожаловать в квест"],
		["ИС-301/2", 3, "третий курс. ты знаешь слишком много"],
		["Д-401 (2023)", 4, "4-й курс и не знаешь расписание?"],
	]) {
		test(`uses the first digit of ${displayName} as the course`, () => {
			assert.deepEqual(
				get(undefined, "07:00", { ...group, displayName: String(displayName) }),
				[
					...generalScheduleSplashes,
					`на ${course}-м курсе весело, да?`,
					expected,
				],
			)
		})
	}

	test("adds the dynamic phrase for other known courses without guessing missing courses", () => {
		for (const course of [2, 5, 6, 9]) {
			assert.deepEqual(
				get(undefined, "07:00", { ...group, displayName: `ИС-${course}01` }),
				[...generalScheduleSplashes, `на ${course}-м курсе весело, да?`],
			)
		}
		assert.deepEqual(
			get(undefined, "07:00", { ...group, displayName: "Тест-001" }),
			generalScheduleSplashes,
		)
	})

	test("personalized splashes are lowercase too", () => {
		const schedule = [
			lesson(),
			lesson({ order: 3, startTime: "11:20", endTime: "12:50" }),
			lesson({ order: 4, isCancelled: true }),
		]
		for (const course of [1, 2, 3, 4]) {
			for (const time of ["07:00", "10:00", "12:00", "16:00"]) {
				for (const phrase of get(schedule, time, {
					...group,
					displayName: `П-${course}01`,
				})) {
					assert.equal(phrase, phrase.toLowerCase())
					assert(!/\$\{course\}/.test(phrase))
				}
			}
		}
	})

	test("does not infer a course from a parenthesized year or a teacher name", () => {
		assert.deepEqual(
			get(undefined, "07:00", { ...group, displayName: "Тест (2024)" }),
			generalScheduleSplashes,
		)
		assert.deepEqual(
			get([lesson()], "07:00", {
				...group,
				type: "teacher",
				displayName: "Преподаватель 4",
			}),
			generalScheduleSplashes,
		)
	})

	test("does not treat missing data as a free day", () => {
		assert(!get().includes("сегодня без пар. серьёзно"))
		assert(get([]).includes("сегодня без пар. серьёзно"))
	})

	test("ignores other dates", () => {
		assert(
			get([lesson({ date: "2026-09-05" })]).includes(
				"сегодня без пар. серьёзно",
			),
		)
	})

	test("counts active slots, not duplicate subgroup rows", () => {
		const phrases = get([
			lesson(),
			lesson(),
			lesson(),
			lesson({ order: 2, isCancelled: true }),
		])
		assert(phrases.includes("сегодня чилл"))
		assert(phrases.includes("одна пара — и свобода"))
		assert(phrases.includes("минус пара, плюс настроение"))
		assert(!phrases.includes("многовато пар сегодня"))
	})

	test("only promises a cancelled pair when its whole slot is cancelled", () => {
		assert(
			!get([lesson(), lesson({ isCancelled: true })]).includes(
				"минус пара, плюс настроение",
			),
		)
		const phrases = get([lesson({ isCancelled: true })])
		assert(phrases.includes("сегодня без пар. серьёзно"))
		assert(phrases.includes("минус пара, плюс настроение"))
		assert(!phrases.includes("сегодня учимся из пледа"))
	})

	test("enables heavy-day copy from four active pairs", () => {
		for (const count of [2, 3, 4, 5]) {
			const phrases = get(
				Array.from({ length: count }, (_, order) =>
					lesson({ order: order + 1 }),
				),
			)
			assert.equal(phrases.includes("многовато пар сегодня"), count >= 4)
			assert.equal(phrases.includes("сегодня чилл"), count <= 2)
		}
	})

	test("offers sleep-related contextual phrases only before classes start", () => {
		assert(get([lesson()]).includes("первая пара? сочувствую"))
		assert(!get([lesson()], "08:00").includes("первая пара? сочувствую"))
		const late = [lesson({ startTime: "10:00", endTime: "11:30" })]
		assert(get(late).includes("можно поспать подольше"))
		assert(!get(late, "10:00").includes("можно поспать подольше"))
	})

	test("distinguishes a free period from an ordinary break", () => {
		const next = lesson({ order: 3, startTime: "11:20", endTime: "12:50" })
		assert(
			get([lesson(), next], "10:00").includes(
				"окно в расписании. проветримся?",
			),
		)
		assert(
			!get([lesson(), { ...next, order: 2 }], "10:00").includes(
				"окно в расписании. проветримся?",
			),
		)
		assert(
			!get([lesson(), next], "11:20").includes(
				"окно в расписании. проветримся?",
			),
		)
	})

	test("requires all non-cancelled classes to be remote", () => {
		assert(
			get([
				lesson({ isDistance: true }),
				lesson({ order: 2, isCancelled: true }),
			]).includes("сегодня учимся из пледа"),
		)
		assert(
			!get([lesson({ isDistance: true }), lesson({ order: 2 })]).includes(
				"сегодня учимся из пледа",
			),
		)
	})

	test("switches the last-pair and finished-day conditions at the end boundary", () => {
		const schedule = [
			lesson(),
			lesson({ order: 2, startTime: "09:40", endTime: "11:10" }),
		]
		const during = get(schedule, "10:00")
		assert(during.includes("последняя пара — финальный босс"))
		assert(!during.includes("на сегодня всё. выдыхай"))
		const finished = get(schedule, "11:10")
		assert(finished.includes("на сегодня всё. выдыхай"))
		assert(!finished.includes("последняя пара — финальный босс"))
		assert(!finished.includes("пятница, но есть нюанс"))
	})

	test("uses Friday copy only on Fridays with unfinished classes", () => {
		assert(get([lesson()]).includes("пятница, но есть нюанс"))
		assert(!get([]).includes("пятница, но есть нюанс"))
		assert(
			!getScheduleSplashes({
				group,
				schedule: [lesson({ date: "2026-09-03" })],
				now: new Date("2026-09-03T07:00:00"),
			}).includes("пятница, но есть нюанс"),
		)
	})

	test("does not make timing claims with invalid or missing lesson times", () => {
		const phrases = get([lesson({ startTime: "00:00", endTime: "00:00" })])
		assert(!phrases.includes("на сегодня всё. выдыхай"))
		assert(!phrases.includes("первая пара? сочувствую"))
		assert(!phrases.includes("пятница, но есть нюанс"))
		assert(phrases.includes("одна пара — и свобода"))
	})
})
