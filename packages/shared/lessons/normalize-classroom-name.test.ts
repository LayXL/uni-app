import { describe, expect, test } from "bun:test"

import type { MapEntity, Room } from "../building-scheme"
import {
	getClassroomNamesForRoom,
	mapClassroom,
	normalizeClassroomName,
} from "./normalize-classroom-name"

const createRoom = (id: number, floorId: number, name: string): Room => ({
	type: "room",
	id,
	floorId,
	name,
	position: { x: 0, y: 0 },
	wallsPosition: [],
})

const rooms: MapEntity[] = [
	createRoom(1, 0, "122"),
	createRoom(2, 0, "122А"),
	createRoom(3, 0, "122Б"),
	createRoom(4, 2, "315а"),
	createRoom(5, 0, "125"),
	createRoom(6, 4, "124"),
	createRoom(7, 4, "125"),
	createRoom(8, 0, "127"),
	createRoom(9, 4, "127"),
	createRoom(10, 6, "Актовый зал"),
]

describe("normalizeClassroomName", () => {
	test.each([
		"305Aкт",
		"305Акт",
		" 305AКТ ",
		"акт.зал",
		" АКТ.ЗАЛ ",
		"акт. зал",
		"акт зал",
		"акт. зал.",
		"актзал",
		"305 Акт",
		"305Акт.",
		"305 Aкт.",
		"акт.зал (1)",
		" АКТ.  ЗАЛ. (2) ",
		"305 Акт. (1)",
		"Актовый зал (1)",
		" АКТОВЫЙ   ЗАЛ ",
	])("maps %s to the assembly hall", (classroom) => {
		expect(normalizeClassroomName(classroom)).toBe("Актовый зал")
	})

	test.each([
		"305",
		"305а",
		"Малый актовый зал",
		"акт.зал отменено",
		"акт.зал (ремонт)",
		"124 шк (1)",
	])("keeps %s unchanged", (classroom) => {
		expect(normalizeClassroomName(classroom)).toBe(classroom)
	})

	test.each([
		["122 А", "122А"],
		["122 Б", "122Б"],
		["122 биб.", "122"],
		["315А", "315а"],
		["103 (2)", "103"],
		["122 А (1)", "122А"],
	])("normalizes %s to %s", (classroom, expected) => {
		expect(normalizeClassroomName(classroom)).toBe(expected)
	})
})

describe("mapClassroom", () => {
	test.each([
		["305Aкт", "Актовый зал", 10],
		["акт.зал", "Актовый зал", 10],
		["акт. зал.", "Актовый зал", 10],
		["305 Акт.", "Актовый зал", 10],
		["акт.зал (1)", "Актовый зал", 10],
		["Актовый зал (2)", "Актовый зал", 10],
		["122 А", "122А", 2],
		["122 Б", "122Б", 3],
		["122 биб.", "122", 1],
		["315А", "315а", 4],
		["124 шк", "124", 6],
		["125тр.зал", "125", 7],
		["127 шк", "127", 9],
	])("maps %s to classroom %s with room %i", (input, classroom, roomId) => {
		expect(mapClassroom(rooms, input)).toEqual({
			classroom,
			classroomId: roomId,
		})
	})

	test("maps a plain number to the main-building room", () => {
		expect(mapClassroom(rooms, "127")).toEqual({
			classroom: "127",
			classroomId: 8,
		})
	})

	test.each([
		"1",
		"108 басП",
		"211 шк",
		"305а",
		"308А",
	])("does not guess a room for %s", (classroom) => {
		expect(mapClassroom(rooms, classroom)).toEqual({ classroom })
	})
})

describe("getClassroomNamesForRoom", () => {
	test("returns the canonical name and Bitrix aliases of the assembly hall", () => {
		expect(getClassroomNamesForRoom(rooms, 10)).toEqual([
			"Актовый зал",
			"305Aкт",
			"305Акт",
			"акт.зал",
			"акт. зал",
			"акт зал",
			"акт. зал.",
			"305 Акт",
			"305Акт.",
		])
	})

	test("uses the school alias for a duplicated room number", () => {
		expect(getClassroomNamesForRoom(rooms, 9)).toEqual(["127 шк"])
	})

	test("uses the plain number for the main-building duplicate", () => {
		expect(getClassroomNamesForRoom(rooms, 8)).toEqual(["127"])
	})

	test("returns no names for an unknown room", () => {
		expect(getClassroomNamesForRoom(rooms, 999)).toEqual([])
	})
})
