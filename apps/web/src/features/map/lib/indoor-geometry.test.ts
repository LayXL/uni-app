import { describe, expect, test } from "bun:test"
import { Raycaster, Vector3 } from "three"

import type { BuildingScheme, Floor } from "@repo/shared/building-scheme"

import { entityCenter, floorRouteChains, wallSegments } from "./indoor-geometry"
import {
	createIndoorFloor,
	createIndoorRoute,
	disposeIndoorGroup,
} from "./indoor-model"
import { isSavedIndoorView } from "./indoor-view-storage"

const square = [
	{ x: 0, y: 0 },
	{ x: 200, y: 0 },
	{ x: 200, y: 200 },
	{ x: 0, y: 200 },
]
const floor: Floor = {
	id: 2,
	name: "Тест",
	position: { x: 300, y: -100 },
	wallsPosition: square,
	holes: [
		[
			{ x: 80, y: 80 },
			{ x: 120, y: 80 },
			{ x: 120, y: 120 },
			{ x: 80, y: 120 },
		],
	],
}

describe("indoor geometry", () => {
	test("opens a doorway without removing the rest of the wall", () => {
		const segments = wallSegments(square, [{ x: 100, y: 3 }], 40)
		expect(segments.filter((s) => s.start.y === 0 && s.end.y === 0)).toEqual([
			{ start: { x: 0, y: 0 }, end: { x: 80, y: 0 } },
			{ start: { x: 120, y: 0 }, end: { x: 200, y: 0 } },
		])
	})
	test("merges overlapping doors and ignores zero-length edges", () => {
		const segments = wallSegments(
			[...square, square[0]],
			[
				{ x: 90, y: 0 },
				{ x: 110, y: 0 },
			],
			40,
		)
		expect(
			segments.filter((s) => s.start.y === 0 && s.end.y === 0),
		).toHaveLength(2)
		expect(
			segments.every(
				(s) => Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y) > 0,
			),
		).toBe(true)
	})
	test("applies floor offsets and splits routes that leave and revisit a floor", () => {
		expect(
			floorRouteChains(
				[
					{ x: 0, y: 0, floor: 2, type: "road" },
					{ x: 10, y: 0, floor: 2, type: "stairs", toFloor: 0 },
					{ x: 20, y: 0, floor: 0, type: "stairs", toFloor: 2 },
					{ x: 30, y: 0, floor: 2, type: "road" },
				],
				floor,
			),
		).toEqual([
			[
				{ x: 300, y: -100 },
				{ x: 310, y: -100 },
			],
			[{ x: 330, y: -100 }],
		])
	})
	test("preserves floor holes in the actual triangulated 3D mesh", () => {
		const model = createIndoorFloor(
			{ floors: [floor], entities: [] },
			floor,
			"light",
		)
		model.group.updateMatrixWorld(true)
		const throughHole = new Raycaster(
			new Vector3(400, 500, 0),
			new Vector3(0, -1, 0),
		)
		const throughFloor = new Raycaster(
			new Vector3(340, 500, -60),
			new Vector3(0, -1, 0),
		)
		expect(throughHole.intersectObject(model.group, true)).toHaveLength(0)
		expect(
			throughFloor.intersectObject(model.group, true).length,
		).toBeGreaterThan(0)
		disposeIndoorGroup(model.group)
	})
	test("keeps room, floor, and label coordinates aligned", () => {
		const room = {
			id: 1,
			name: "101",
			type: "room" as const,
			floorId: 2,
			position: { x: 10, y: 20 },
			wallsPosition: square,
		}
		expect(entityCenter(room, floor)).toEqual({ x: 410, y: 20 })
		const data: BuildingScheme = {
			floors: [floor],
			entities: [
				room,
				{
					id: 3,
					type: "place",
					name: "Скрыто",
					floorId: 2,
					position: { x: 0, y: 0 },
					hiddenOnMap: true,
				},
			],
		}
		const model = createIndoorFloor(data, floor, "dark")
		expect(model.labels).toHaveLength(1)
		expect(model.labels[0].position).toEqual(entityCenter(room, floor))
		disposeIndoorGroup(model.group)
	})
	test("rejects corrupt and unbounded persisted cameras", () => {
		const saved = {
			floorId: 0,
			target: [1, 0, 1],
			offset: [0, 4000, 2500],
			zoom: 1,
			view: "3d",
		}
		expect(isSavedIndoorView(saved)).toBe(true)
		for (const invalid of [
			null,
			{},
			{ ...saved, zoom: 0 },
			{ ...saved, target: [Infinity, 0, 0] },
			{ ...saved, offset: [0, -1, 0] },
			{ ...saved, view: "unknown" },
		])
			expect(isSavedIndoorView(invalid)).toBe(false)
	})
	test("renders a diagonal route through its midpoint and links to floor zero", () => {
		const data: BuildingScheme = {
			floors: [floor, { ...floor, id: 0, name: "1 этаж" }],
			entities: [],
		}
		const model = createIndoorRoute(
			[
				{ x: 10, y: 10, floor: 2, type: "road" },
				{ x: 150, y: 150, floor: 2, type: "stairs", toFloor: 0 },
				{ x: 150, y: 150, floor: 0, type: "road" },
			],
			floor,
			data,
		)
		model.group.updateMatrixWorld(true)
		const throughRoute = new Raycaster(
			new Vector3(380, 500, -20),
			new Vector3(0, -1, 0),
		)
		expect(
			throughRoute.intersectObject(model.group, true).length,
		).toBeGreaterThan(0)
		expect(model.labels.find((label) => label.floorId === 0)?.text).toBe(
			"Далее: 1 этаж",
		)
		disposeIndoorGroup(model.group)
	})
})
