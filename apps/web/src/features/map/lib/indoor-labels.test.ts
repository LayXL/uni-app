import { describe, expect, test } from "bun:test"

import type { BuildingScheme, Floor } from "@repo/shared/building-scheme"

import {
	createIndoorFloor,
	createIndoorRoute,
	disposeIndoorGroup,
} from "./indoor-model"

const university: Floor = {
	id: 0,
	name: "2 этаж",
	position: { x: 0, y: 0 },
	wallsPosition: [
		{ x: 0, y: 0 },
		{ x: 300, y: 0 },
		{ x: 300, y: 300 },
		{ x: 0, y: 300 },
	],
	stairs: [
		{ id: 8, floors: [0, 10], position: { x: 10, y: 20 } },
		{ id: 9, floors: [0, 4], position: { x: 40, y: 50 } },
	],
}
const school: Floor = {
	...university,
	id: 10,
	name: "2 этаж школы",
	stairs: [{ id: 8, floors: [0, 10], position: { x: 100, y: 200 } }],
}
const data: BuildingScheme = {
	floors: [university, school, { ...university, id: 4, name: "3 этаж" }],
	entities: ["toilet", "toilet-men", "toilet-women"].map((icon, id) => ({
		id,
		type: "place",
		floorId: university.id,
		name: "Туалет",
		icon,
		position: { x: 0, y: 0 },
	})),
}

describe("indoor landmark labels", () => {
	test("keeps accessible names and distinct toilet icons without visible text", () => {
		const model = createIndoorFloor(data, university, "light")
		const toilets = model.labels.filter((label) => label.entityId != null)
		expect(toilets.map((label) => label.icon)).toEqual([
			"toilet",
			"toilet-men",
			"toilet-women",
		])
		expect(
			toilets.every((label) => label.iconOnly && label.text === "Туалет"),
		).toBe(true)
		expect(model.labels.find((label) => label.icon === "stairs")).toMatchObject(
			{
				text: "Лестница",
				iconOnly: true,
			},
		)
		disposeIndoorGroup(model.group)
	})

	test("distinguishes the passage in both buildings without relying on floor IDs", () => {
		for (const [floor, destination, icon, text] of [
			[university, school, "seven", "В школу"],
			[school, university, "midis", "В МИДИС"],
		] as const) {
			const model = createIndoorFloor(data, floor, "light")
			const passage = model.labels.find(
				(label) => label.floorId === destination.id,
			)
			expect(passage).toMatchObject({ icon, text })
			expect(passage?.iconOnly).not.toBe(true)
			// A passage adds no fake stair geometry, unlike the remaining real staircase.
			const withoutPassage = createIndoorFloor(
				data,
				{
					...floor,
					stairs: floor.stairs?.filter((stair) => stair.id !== 8),
				},
				"light",
			)
			expect(model.group.children.length).toBe(
				withoutPassage.group.children.length,
			)
			disposeIndoorGroup(model.group)
			disposeIndoorGroup(withoutPassage.group)
		}
	})

	test("uses the same destination icons and names while following a route", () => {
		for (const [floor, destination, icon, text] of [
			[university, school, "seven", "В школу"],
			[school, university, "midis", "В МИДИС"],
		] as const) {
			const model = createIndoorRoute(
				[
					{ x: 0, y: 0, floor: floor.id, type: "road" },
					{
						x: 10,
						y: 20,
						floor: floor.id,
						type: "stairs",
						toFloor: destination.id,
					},
					{ x: 100, y: 200, floor: destination.id, type: "road" },
				],
				floor,
				data,
			)
			expect(
				model.labels.find((label) => label.floorId === destination.id),
			).toMatchObject({ icon, text })
			disposeIndoorGroup(model.group)
		}
	})
})
