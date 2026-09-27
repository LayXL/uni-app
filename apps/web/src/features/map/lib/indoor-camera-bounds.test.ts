import { expect, test } from "bun:test"
import { OrthographicCamera, Vector3 } from "three"
import { MapControls } from "three/addons/controls/MapControls.js"

import type { Floor } from "@repo/shared/building-scheme"

import {
	createIndoorCameraConstraint,
	createIndoorPanConstraint,
} from "./indoor-camera-bounds"

const floor: Floor = {
	id: 1,
	name: "1",
	position: { x: 300, y: -200 },
	wallsPosition: [
		{ x: 0, y: 0 },
		{ x: 1000, y: 0 },
		{ x: 1000, y: 200 },
		{ x: 200, y: 200 },
		{ x: 200, y: 1000 },
		{ x: 0, y: 1000 },
	],
}

const envelope: Floor = {
	...floor,
	wallsPosition: floor.wallsPosition.filter(
		(point) => point.x !== 200 || point.y !== 200,
	),
}

function setup(width = 800, height = 600, zoom = 1, tilt = 0.7, heading = 0) {
	const camera = new OrthographicCamera(
		(-300 * width) / height,
		(300 * width) / height,
		300,
		-300,
		1,
		100000,
	)
	const target = new Vector3(400, 0, -100)
	camera.position
		.copy(target)
		.add(new Vector3().setFromSphericalCoords(5000, tilt, heading))
	camera.lookAt(target)
	camera.zoom = zoom
	camera.updateProjectionMatrix()
	return { camera, target }
}

function hasVisibleBoundary(camera: OrthographicCamera, floors: Floor[]) {
	for (const part of floors) {
		for (const ring of [part.wallsPosition, ...(part.holes ?? [])]) {
			for (let i = 0; i < ring.length; i++) {
				const a = ring[i]
				const b = ring[(i + 1) % ring.length]
				for (let step = 0; step <= 128; step++) {
					const p = new Vector3(
						a.x + ((b.x - a.x) * step) / 128 + part.position.x,
						0,
						a.y + ((b.y - a.y) * step) / 128 + part.position.y,
					).project(camera)
					if (Math.abs(p.x) < 0.99 && Math.abs(p.y) < 0.99 && Math.abs(p.z) < 1)
						return true
				}
			}
		}
	}
	return false
}

test("dragging in every direction keeps the floor envelope visible at different zooms, headings, tilts and screen sizes", () => {
	const constrain = createIndoorCameraConstraint([floor])
	for (const [width, height] of [
		[800, 600],
		[390, 844],
	]) {
		for (const zoom of [0.35, 1, 12]) {
			for (const tilt of [0.000001, 0.7, Math.PI / 3]) {
				for (const heading of [-2.3, 0, 1.2]) {
					for (let direction = 0; direction < 8; direction++) {
						const { camera, target } = setup(width, height, zoom, tilt, heading)
						const shift = new Vector3(
							Math.cos((direction * Math.PI) / 4) * 50000,
							0,
							Math.sin((direction * Math.PI) / 4) * 50000,
						)
						camera.position.add(shift)
						target.add(shift)
						const offset = camera.position.clone().sub(target)
						const rotation = camera.quaternion.clone()
						expect(constrain(camera, target, width, height)).toBe(true)
						expect(hasVisibleBoundary(camera, [envelope])).toBe(true)
						expect(
							camera.position.clone().sub(target).distanceTo(offset),
						).toBeLessThan(1e-8)
						expect(camera.quaternion.equals(rotation)).toBe(true)
						expect(camera.zoom).toBe(zoom)
						expect(target.y).toBe(0)
						expect(constrain(camera, target, width, height)).toBe(false)
					}
				}
			}
		}
	}
})

test("normal navigation over the floor is unchanged", () => {
	const { camera, target } = setup()
	const position = camera.position.clone()
	expect(createIndoorCameraConstraint([floor])(camera, target, 800, 600)).toBe(
		false,
	)
	expect(camera.position.equals(position)).toBe(true)
})

// A straight edge at x=1300 makes the outward travel measurable in pixels.
function setupPan() {
	const { camera, target } = setup(800, 600, 1, 0.000001)
	camera.position.x += 900
	target.x += 900
	const constrain = createIndoorPanConstraint([floor])
	constrain(camera, target, 800, 600)
	const move = (dx: number, dy = 0) => {
		camera.position.x += dx
		target.x += dx
		camera.position.z += dy
		target.z += dy
		return constrain(camera, target, 800, 600)
	}
	return { camera, target, constrain, move }
}

test("outward dragging progressively slows down and stays within the limit", () => {
	const { camera, target, move } = setupPan()
	const offset = camera.position.clone().sub(target)
	let previousTravel = 10
	for (let step = 0; step < 50; step++) {
		const before = target.x
		move(10)
		const travel = target.x - before
		expect(travel).toBeGreaterThan(0)
		expect(travel).toBeLessThan(previousTravel)
		expect(target.x).toBeLessThanOrEqual(1340)
		previousTravel = travel
	}
	expect(previousTravel).toBeLessThan(0.01)
	expect(camera.position.clone().sub(target).distanceTo(offset)).toBeLessThan(
		1e-8,
	)
})

test("a stationary map stays still; inward and tangential dragging are immediate", () => {
	const { camera, target, constrain, move } = setupPan()
	move(60)
	const restingTarget = target.clone()
	const restingCamera = camera.position.clone()
	for (let frame = 0; frame < 120; frame++)
		expect(constrain(camera, target, 800, 600)).toBe(false)
	expect(target.equals(restingTarget)).toBe(true)
	expect(camera.position.equals(restingCamera)).toBe(true)
	move(0, 5)
	expect(target.z).toBeCloseTo(restingTarget.z + 5, 8)
	expect(target.x).toBeCloseTo(restingTarget.x, 8)
	move(-10)
	expect(target.x).toBeCloseTo(restingTarget.x - 10, 8)
})

test("resistance depends on travel, not pointer event frequency", () => {
	const results = [1, 10, 20].map((steps) => {
		const { target, move } = setupPan()
		for (let step = 0; step < steps; step++) move(100 / steps)
		return target.x
	})
	expect(results[0]).toBeCloseTo(results[1], 8)
	expect(results[0]).toBeCloseTo(results[2], 8)
})

test("ordinary pan and programmatic positioning bypass resistance", () => {
	const { camera, target } = setup()
	const constrain = createIndoorPanConstraint([floor])
	constrain(camera, target, 800, 600)
	camera.position.x += 10
	target.x += 10
	expect(constrain(camera, target, 800, 600)).toBe(false)
	expect(target.x).toBe(410)
	camera.position.x += 910
	target.x += 910
	expect(constrain(camera, target, 800, 600, false)).toBe(false)
	expect(target.x).toBe(1320)
})

test("empty space between wings and inside courtyards allows free navigation", () => {
	const courtyard: Floor = {
		...floor,
		wallsPosition: [
			{ x: 0, y: 0 },
			{ x: 1000, y: 0 },
			{ x: 1000, y: 1000 },
			{ x: 0, y: 1000 },
		],
		holes: [
			[
				{ x: 100, y: 100 },
				{ x: 900, y: 100 },
				{ x: 900, y: 900 },
				{ x: 100, y: 900 },
			],
		],
	}
	const cases: { floors: Floor[]; center: Vector3 }[] = [
		{ floors: [floor], center: new Vector3(800, 0, 300) },
		{
			floors: [floor, { ...floor, position: { x: 3000, y: 3000 } }],
			center: new Vector3(1750, 0, 1500),
		},
		{ floors: [courtyard], center: new Vector3(800, 0, 300) },
	]
	for (const { floors, center } of cases) {
		for (const tilt of [0.000001, 0.7]) {
			for (const heading of [-2.3, 0, 1.2]) {
				for (const createConstraint of [
					createIndoorCameraConstraint,
					createIndoorPanConstraint,
				]) {
					const { camera, target } = setup(800, 600, 12, tilt, heading)
					camera.position.add(center.clone().sub(target))
					target.copy(center)
					const constrain = createConstraint(floors)
					for (let step = 0; step < 10; step++) {
						const position = camera.position.clone()
						const expected = target.clone()
						expect(constrain(camera, target, 800, 600)).toBe(false)
						expect(camera.position.equals(position)).toBe(true)
						expect(target.equals(expected)).toBe(true)
						camera.position.x += 2
						target.x += 2
					}
				}
			}
		}
	}
})

test("zooming, resizing, and changing floors reapply the constraint", () => {
	const { camera, target } = setup()
	const constrain = createIndoorCameraConstraint([floor])
	camera.position.x += 10000
	target.x += 10000
	constrain(camera, target, 800, 600)
	camera.zoom = 12
	camera.updateProjectionMatrix()
	expect(constrain(camera, target, 800, 600)).toBe(true)
	camera.left = -100
	camera.right = 100
	camera.updateProjectionMatrix()
	expect(constrain(camera, target, 200, 600)).toBe(true)
	expect(hasVisibleBoundary(camera, [envelope])).toBe(true)
	const next = { ...floor, position: { x: -3000, y: -2000 } }
	expect(createIndoorCameraConstraint([next])(camera, target, 200, 600)).toBe(
		true,
	)
	expect(
		hasVisibleBoundary(camera, [{ ...envelope, position: next.position }]),
	).toBe(true)
})

test("inertia cannot move the building out of view and settles at the boundary", () => {
	const { camera, target } = setup()
	const controls = new MapControls(camera)
	controls.target.copy(target)
	controls.domElement = { clientWidth: 800, clientHeight: 600 } as HTMLElement
	controls.screenSpacePanning = false
	controls.enableDamping = true
	controls.dampingFactor = 0.12
	const constrain = createIndoorCameraConstraint([floor])
	controls.pan(50000, 50000)
	for (let frame = 0; frame < 300; frame++) {
		controls.update()
		constrain(camera, controls.target, 800, 600)
		expect(hasVisibleBoundary(camera, [envelope])).toBe(true)
	}
	expect(controls.update()).toBe(false)
})

test("empty floors and hidden viewports do not move the camera", () => {
	const { camera, target } = setup()
	expect(createIndoorCameraConstraint([])(camera, target, 800, 600)).toBe(false)
	expect(createIndoorCameraConstraint([floor])(camera, target, 1, 1)).toBe(
		false,
	)
})

test("small pointer movements at the boundary never cause a large camera correction", () => {
	for (const heading of [-2.3, 0.4, 1.2]) {
		for (let direction = 0; direction < 8; direction++) {
			const { camera, target } = setup(390, 844, 2, 0.7, heading)
			const controls = new MapControls(camera)
			controls.target.copy(target)
			controls.domElement = {
				clientWidth: 390,
				clientHeight: 844,
			} as HTMLElement
			controls.screenSpacePanning = false
			const constrain = createIndoorCameraConstraint([floor])
			const dx = Math.cos((direction * Math.PI) / 4) * 8
			const dy = Math.sin((direction * Math.PI) / 4) * 8
			for (let frame = 0; frame < 500; frame++) {
				controls.pan(dx, dy)
				controls.update()
				camera.updateMatrixWorld(true)
				const before = new Vector3().project(camera)
				constrain(camera, controls.target, 390, 844)
				const after = new Vector3().project(camera)
				const correction = Math.hypot(
					(after.x - before.x) * 195,
					(after.y - before.y) * 422,
				)
				// Returning to the previous valid view costs at most the pointer's 8px step.
				expect(correction).toBeLessThanOrEqual(8 + 1e-6)
			}
		}
	}
})
