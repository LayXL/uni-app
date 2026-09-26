import { describe, expect, test } from "bun:test"
import {
	ExtrudeGeometry,
	Mesh,
	MeshBasicMaterial,
	Raycaster,
	Vector3,
} from "three"

import type { Coordinate, Floor } from "@repo/shared/building-scheme"

import { createIndoorFloor, disposeIndoorGroup } from "./indoor-model"
import { createWallShapes } from "./indoor-walls"

const square = [
	{ x: 0, y: 0 },
	{ x: 200, y: 0 },
	{ x: 200, y: 200 },
	{ x: 0, y: 200 },
]

const withWalls = (
	points: Coordinate[],
	doors: Coordinate[],
	check: (hits: (x: number, y: number) => number[]) => void,
) => {
	const floor: Floor = {
		id: 1,
		name: "Test",
		position: { x: 300, y: -100 },
		wallsPosition: [
			{ x: -400, y: -400 },
			{ x: 400, y: -400 },
			{ x: 400, y: 400 },
			{ x: -400, y: 400 },
		],
	}
	const model = createIndoorFloor(
		{
			floors: [floor],
			entities: [
				{
					id: 1,
					type: "room",
					name: "101",
					floorId: 1,
					position: { x: 10, y: 20 },
					wallsPosition: points,
					doorsPosition: doors,
				},
			],
		},
		floor,
		"light",
	)
	model.group.updateMatrixWorld(true)
	try {
		check((x, y) =>
			new Raycaster(new Vector3(x + 310, 100, y - 80), new Vector3(0, -1, 0))
				.intersectObjects(
					model.group.children.filter((mesh) => mesh.name === "indoor-walls"),
				)
				.map((hit) => hit.point.y),
		)
	} finally {
		disposeIndoorGroup(model.group)
	}
}

describe("joined indoor walls", () => {
	test("closed walls face both the room interior and the outside in either winding", () => {
		for (const points of [square, [...square].reverse()]) {
			const geometry = new ExtrudeGeometry(createWallShapes(points), {
				depth: 58,
				bevelEnabled: false,
			})
			geometry.rotateX(-Math.PI / 2)
			const material = new MeshBasicMaterial()
			const mesh = new Mesh(geometry, material)
			try {
				for (const [origin, direction, expectedX] of [
					[new Vector3(100, 29, 100), new Vector3(-1, 0, 0), 3],
					[new Vector3(-20, 29, 100), new Vector3(1, 0, 0), -3],
				] as const) {
					const hit = new Raycaster(origin, direction).intersectObject(mesh)[0]
					expect(hit).toBeDefined()
					expect(hit.point.x).toBeCloseTo(expectedX)
				}
			} finally {
				geometry.dispose()
				material.dispose()
			}
		}
	})

	test("does not put a low perimeter wall inside a coincident room wall", () => {
		const floor: Floor = {
			id: 0,
			name: "Test",
			position: { x: 0, y: 0 },
			wallsPosition: square,
		}
		const model = createIndoorFloor(
			{
				floors: [floor],
				entities: [
					{
						id: 1,
						floorId: 0,
						type: "room",
						name: "Test",
						position: { x: 0, y: 0 },
						wallsPosition: square,
					},
				],
			},
			floor,
			"light",
		)
		model.group.updateMatrixWorld(true)
		try {
			const hits = new Raycaster(new Vector3(81, 100, 1), new Vector3(0, -1, 0))
				.intersectObjects(
					model.group.children.filter((mesh) => mesh.name === "indoor-walls"),
				)
				.map((hit) => hit.point.y)
			expect(hits).toEqual([58])
		} finally {
			disposeIndoorGroup(model.group)
		}
	})
	for (const [name, points] of [
		["clockwise", square],
		["counterclockwise", [...square].reverse()],
		["repeated vertices", [square[0], ...square, square[0]]],
	] as const) {
		test(`fills all square corners without overlapping top faces (${name})`, () => {
			withWalls([...points], [], (hits) => {
				for (const [x, y] of [
					[-2, -1],
					[202, -1],
					[202, 201],
					[-2, 201],
					[1, 1.5],
				])
					expect(hits(x, y)).toEqual([58])
				expect(hits(100, 100)).toEqual([])
			})
		})
	}

	test("keeps the full doorway clear while joining the closing corner", () => {
		withWalls(square, [{ x: 100, y: 3 }], (hits) => {
			for (const x of [82.1, 100, 117.9]) expect(hits(x, 0)).toEqual([])
			for (const x of [81.9, 118.1]) expect(hits(x, 0)).toEqual([58])
			expect(hits(-2, -1)).toEqual([58])
		})
	})

	test("does not join across a doorway reaching a corner", () => {
		withWalls(square, [{ x: 0, y: 0 }], (hits) => {
			expect(hits(-2, -1)).toEqual([])
			expect(hits(10, 0)).toEqual([])
			expect(hits(0, 10)).toEqual([])
			expect(hits(19, 0)).toEqual([58])
			expect(hits(0, 19)).toEqual([58])
		})
	})

	test("joins concave corners without filling the room or its recess", () => {
		withWalls(
			[
				{ x: 0, y: 0 },
				{ x: 200, y: 0 },
				{ x: 200, y: 100 },
				{ x: 100, y: 100 },
				{ x: 100, y: 200 },
				{ x: 0, y: 200 },
			],
			[],
			(hits) => {
				expect(hits(98, 98.5)).toEqual([58])
				expect(hits(101, 101.5)).toEqual([58])
				expect(hits(96, 96)).toEqual([])
				expect(hits(104, 104)).toEqual([])
			},
		)
	})

	test("joins diagonal walls with the same thickness", () => {
		const rotate = ({ x, y }: Coordinate) => ({
			x: (x - y) / Math.SQRT2,
			y: (x + y) / Math.SQRT2,
		})
		withWalls(square.map(rotate), [], (hits) => {
			for (const point of [
				{ x: -2, y: -1 },
				{ x: 202, y: 201 },
			]) {
				const p = rotate(point)
				expect(hits(p.x, p.y)).toEqual([58])
			}
			const p = rotate({ x: -4, y: -1 })
			expect(hits(p.x, p.y)).toEqual([])
		})
	})
})
