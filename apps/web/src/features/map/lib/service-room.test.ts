import { expect, test } from "bun:test"
import { Raycaster, Vector3 } from "three"

import { isRoom } from "@repo/shared/building-scheme"
import { buildingSchemeSchema } from "@repo/shared/building-scheme-schema"

import scheme from "../../../../../../scripts/v3.json"
import { entityCenter } from "./indoor-geometry"
import { createIndoorFloor, disposeIndoorGroup } from "./indoor-model"

test("service area keeps its clickable outline without showing a map label", () => {
	const data = buildingSchemeSchema.parse(scheme)
	const floor = data.floors.find((f) => f.id === 0)
	const room = data.entities.find((e) => e.id === 172)
	if (!floor || !room || !isRoom(room)) throw new Error("Missing service room")
	expect(room.name).toBe("Служебное помещение")
	expect(room.nameHidden).toBe(true)
	expect(room.labelPosition).toEqual({ x: 1000, y: 450 })
	expect(
		entityCenter(
			{ ...room, position: { x: 10, y: 20 } },
			{ ...floor, position: { x: 300, y: -100 } },
		),
	).toEqual({ x: 1310, y: 370 })
	const model = createIndoorFloor(data, floor, "dark")
	const mesh = model.rooms.get(room.id)
	if (!mesh) throw new Error("Missing service room mesh")
	expect(mesh.userData.entityId).toBe(room.id)
	model.group.updateMatrixWorld(true)
	const contains = (x: number, y: number) =>
		new Raycaster(
			new Vector3(x, 100, y),
			new Vector3(0, -1, 0),
		).intersectObject(mesh).length > 0
	try {
		for (const [x, y] of [
			[1000, 450],
			[300, 800],
			[480, 1300],
		])
			expect(contains(x, y)).toBe(true)
		// Adjacent rooms and the outside cutout stay outside the new floor mesh.
		for (const [x, y] of [
			[900, 900],
			[200, 1300],
			[600, 1300],
			[100, 200],
		])
			expect(contains(x, y)).toBe(false)
		expect(
			model.labels.find((label) => label.entityId === room.id),
		).toBeUndefined()
	} finally {
		disposeIndoorGroup(model.group)
	}
})
