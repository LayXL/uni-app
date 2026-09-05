import assert from "node:assert/strict"
import { test } from "node:test"

import { formatRoomTeacherSummary } from "./format-room-teacher-summary"

const usynina = {
	id: 1,
	displayName: "Усынина Анна Михайловна (Преподаватель)",
}
const plekhanova = {
	id: 2,
	displayName: "Плеханова Наталья Владимировна (Преподаватель)",
}
const ivanov = { id: 3, displayName: "Иванов Иван Иванович (Преподаватель)" }

const format = (previous: (typeof usynina)[], current: (typeof usynina)[]) =>
	formatRoomTeacherSummary({ previous, current }).replaceAll("\u00a0", " ")

test("uses genitive surnames and initials for previous and current teachers", () => {
	assert.equal(
		format([usynina], [plekhanova]),
		"Тут была пара Усыниной А. М. Сейчас тут пара Плехановой Н. В.",
	)
})

test("omits current lesson text during a break", () => {
	assert.equal(format([ivanov], []), "Тут была пара Иванова И. И.")
})

test("does not invent a previous teacher when there is no history", () => {
	assert.equal(format([], [plekhanova]), "Сейчас тут пара Плехановой Н. В.")
	assert.equal(format([], []), "")
})

test("lists multiple teachers once without a duplicate sentence-ending dot", () => {
	assert.equal(
		format([usynina, usynina, ivanov], []),
		"Тут была пара Усыниной А. М. и Иванова И. И.",
	)
})
