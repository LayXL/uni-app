import { expect, test } from "bun:test"
import { Box3, Raycaster, Vector3 } from "three"

import { buildingSchemeSchema } from "@repo/shared/building-scheme-schema"

import scheme from "../../../../../../scripts/v3.json"
import {
	createIndoorFloor,
	createIndoorLevel,
	disposeIndoorGroup,
	highlightIndoorRoom,
} from "./indoor-model"

test("fountain replaces its badge with a square model and remains pickable from above and the side", () => {
	const data = buildingSchemeSchema.parse(scheme)
	const source = data.floors.find((f) => f.id === 0)
	const fountain = data.entities.find((e) => e.icon === "fountain")
	if (!source || !fountain) throw new Error("Missing fountain fixture")
	const floor = { ...source, position: { x: 200, y: -300 } }
	const x = fountain.position.x + floor.position.x
	const z = fountain.position.y + floor.position.y
	for (const theme of ["light", "dark"] as const) {
		const model = createIndoorFloor(data, floor, theme)
		try {
			model.group.updateMatrixWorld(true)
			const object = model.group.getObjectByName("indoor-fountain")
			if (!object) throw new Error("Missing fountain model")
			const bounds = new Box3().setFromObject(object)
			expect(bounds.getCenter(new Vector3()).x).toBe(x)
			expect(bounds.getCenter(new Vector3()).z).toBe(z)
			expect(bounds.max.x - bounds.min.x).toBe(bounds.max.z - bounds.min.z)
			expect(bounds.min.y).toBeGreaterThan(0)
			for (const [origin, direction] of [
				[new Vector3(x + 40, 100, z), new Vector3(0, -1, 0)],
				[new Vector3(x + 100, 12, z), new Vector3(-1, 0, 0)],
			]) {
				const hit = new Raycaster(origin, direction).intersectObjects(
					model.pickTargets,
					false,
				)[0]
				expect(hit?.object.userData.entityId).toBe(fountain.id)
			}
			const label = model.labels.find((l) => l.entityId === fountain.id)
			expect(label).toMatchObject({
				kind: "model",
				iconOnly: true,
				text: "Фонтан",
			})
			expect(label?.icon).toBeUndefined()
			highlightIndoorRoom(model, fountain.id)
			expect(
				model.landmarkMaterials.get(fountain.id)?.color.getHexString(),
			).toBe("fc4c01")
			highlightIndoorRoom(model, null)
			expect(
				model.landmarkMaterials.get(fountain.id)?.color.getHexString(),
			).toBe("ffffff")
		} finally {
			disposeIndoorGroup(model.group)
		}
	}
})

test("fountain picking survives level assembly and hidden POIs create no model", () => {
	const data = buildingSchemeSchema.parse(scheme)
	const floor = data.floors.find((f) => f.id === 0)
	const fountain = data.entities.find((e) => e.icon === "fountain")
	if (!floor || !fountain || fountain.type !== "place")
		throw new Error("Missing fountain fixture")
	const model = createIndoorLevel(data, floor, "light")
	try {
		expect(
			model.pickTargets.some((mesh) => mesh.userData.entityId === fountain.id),
		).toBe(true)
	} finally {
		disposeIndoorGroup(model.group)
	}
	const hidden = createIndoorFloor(
		{ ...data, entities: [{ ...fountain, hiddenOnMap: true }] },
		floor,
		"light",
	)
	try {
		expect(hidden.group.getObjectByName("indoor-fountain")).toBeUndefined()
		expect(hidden.labels.some((l) => l.entityId === fountain.id)).toBe(false)
	} finally {
		disposeIndoorGroup(hidden.group)
	}
})
