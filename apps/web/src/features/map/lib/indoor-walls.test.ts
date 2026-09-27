import { describe, expect, test } from "bun:test"
import {
	ExtrudeGeometry,
	Mesh,
	MeshBasicMaterial,
	Raycaster,
	Vector3,
} from "three"

import type {
	BuildingScheme,
	Coordinate,
	Floor,
} from "@repo/shared/building-scheme"

import scheme from "../../../../../../scripts/v3.json"
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
	test("clips the perimeter against the full corner of room 103 by the entrance", () => {
		const data = scheme as BuildingScheme
		const floor = data.floors.find((floor) => floor.id === 0)
		const room = data.entities.find((entity) => entity.name === "103")
		if (!floor || !room) throw new Error("Missing room 103 fixture")
		const model = createIndoorFloor(
			{ floors: [floor], entities: [room] },
			floor,
			"light",
		)
		model.group.updateMatrixWorld(true)
		const walls = model.group.children.filter(
			(mesh) => mesh.name === "indoor-walls",
		)
		try {
			// The centerline ends at x=1281, but the miter extends to x=1284.
			for (const x of [1280, 1282, 1283.5]) {
				const hits = new Raycaster(
					new Vector3(x, 100, 2314.2),
					new Vector3(0, -1, 0),
				)
					.intersectObjects(walls)
					.map((hit) => hit.point.y)
				expect(hits).toEqual([58])
				const sideHits = new Raycaster(
					new Vector3(x, 8, 2340),
					new Vector3(0, 0, -1),
				)
					.intersectObjects(walls)
					.filter((hit) => Math.abs(hit.point.z - 2318) < 0.001)
				expect(sideHits).toHaveLength(1)
			}
			const uncovered = new Raycaster(
				new Vector3(1285, 100, 2314.2),
				new Vector3(0, -1, 0),
			)
				.intersectObjects(walls)
				.map((hit) => hit.point.y)
			expect(uncovered).toEqual([16])
		} finally {
			disposeIndoorGroup(model.group)
		}
	})

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
	for (const angle of [0, Math.PI / 5]) {
		for (const offset of [0, 2]) {
			test(`clips crossings and parallel overlaps at angle ${angle}, offset ${offset}`, () => {
				const rotate = ({ x, y }: Coordinate) => ({
					x: x * Math.cos(angle) - y * Math.sin(angle),
					y: x * Math.sin(angle) + y * Math.cos(angle),
				})
				const floor: Floor = {
					id: 0,
					name: "Test",
					position: { x: 3000, y: -1200 },
					wallsPosition: [
						{ x: -100, y: offset },
						{ x: 300, y: offset },
						{ x: 300, y: 300 },
						{ x: -100, y: 300 },
					].map(rotate),
					// Also exercise the taller courtyard perimeter crossing a room.
					holes: [
						[
							{ x: -50, y: 90 },
							{ x: 250, y: 90 },
							{ x: 250, y: 110 },
							{ x: -50, y: 110 },
						].map(rotate),
					],
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
								wallsPosition: square.map(rotate),
								doorsPosition: [{ x: 100, y: 0 }].map(rotate),
							},
						],
					},
					floor,
					"light",
				)
				model.group.updateMatrixWorld(true)
				const walls = model.group.children.filter(
					(mesh) => mesh.name === "indoor-walls",
				)
				const heights = (x: number, y: number) => {
					const p = rotate({ x, y })
					return new Raycaster(
						new Vector3(p.x + 3000, 100, p.y - 1200),
						new Vector3(0, -1, 0),
					)
						.intersectObjects(walls)
						.map((hit) => Math.round(hit.point.y))
				}
				try {
					for (const x of [-2, 1, 199, 202]) {
						expect(heights(x, 1.2)).toEqual([58])
						expect(heights(x, 90.2)).toEqual([58])
					}
					// Preserve the lower wall through a room doorway and room interior.
					expect(heights(100, 1.2)).toEqual([16])
					expect(heights(100, 90.2)).toEqual([24])
					expect(heights(50, 50)).toEqual([])
					expect(heights(205, 1.2)).toEqual([16])
					if (offset) expect(heights(50, 4)).toEqual([16])
				} finally {
					disposeIndoorGroup(model.group)
				}
			})
		}
	}

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
