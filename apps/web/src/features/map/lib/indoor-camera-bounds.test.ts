import { expect, test } from "bun:test"
import { OrthographicCamera, Vector3 } from "three"
import { MapControls } from "three/addons/controls/MapControls.js"

import type { Floor } from "@repo/shared/building-scheme"

import { createIndoorCameraConstraint } from "./indoor-camera-bounds"

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

test("dragging in every direction keeps the building visible at different zooms, headings, tilts and screen sizes", () => {
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
						expect(hasVisibleBoundary(camera, [floor])).toBe(true)
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

test("empty space inside a concave outline, between buildings, and inside a courtyard is constrained", () => {
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
	for (const floors of [
		[floor],
		[floor, { ...floor, position: { x: 3000, y: 3000 } }],
		[courtyard],
	]) {
		const { camera, target } = setup(800, 600, 12, 0.000001)
		const shift = new Vector3(500, 0, 500)
		camera.position.add(shift)
		target.add(shift)
		expect(createIndoorCameraConstraint(floors)(camera, target, 800, 600)).toBe(
			true,
		)
		expect(hasVisibleBoundary(camera, floors)).toBe(true)
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
	expect(hasVisibleBoundary(camera, [floor])).toBe(true)
	const next = { ...floor, position: { x: -3000, y: -2000 } }
	expect(createIndoorCameraConstraint([next])(camera, target, 200, 600)).toBe(
		true,
	)
	expect(hasVisibleBoundary(camera, [next])).toBe(true)
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
		expect(hasVisibleBoundary(camera, [floor])).toBe(true)
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
