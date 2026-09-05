import { describe, expect, test } from "bun:test"
import { OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from "three"
import { MapControls } from "three/addons/controls/MapControls.js"

import {
	createIndoorTouchRotation,
	rotateIndoorAt,
} from "./indoor-touch-rotation"

function setup(top: boolean, reducedMotion = false) {
	const camera = new OrthographicCamera(-400, 400, 300, -300, 1, 10000)
	camera.position.set(0, 2000, top ? 0.001 : 1200)
	const controls = new MapControls(camera)
	controls.maxPolarAngle = top ? 0 : Math.PI / 3
	controls.update()
	const host = {
		getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
	} as HTMLElement
	const touch = createIndoorTouchRotation(
		host,
		camera,
		controls,
		{ matches: reducedMotion } as MediaQueryList,
		() => {},
	)
	return { camera, controls, touch }
}
const pointer = (id: number, x: number, y: number, time: number) =>
	({
		pointerId: id,
		pointerType: "touch",
		clientX: x,
		clientY: y,
		timeStamp: time,
	}) as PointerEvent

describe("two-finger indoor rotation", () => {
	for (const top of [true, false]) {
		test(`${top ? "2D" : "3D"} follows a 90 degree twist even when the midpoint does not move`, () => {
			const { controls, touch } = setup(top)
			touch.down(pointer(1, 300, 300, 0))
			touch.down(pointer(2, 500, 300, 0))
			touch.move(pointer(1, 400, 200, 16))
			touch.move(pointer(2, 400, 400, 16))
			controls.update()
			expect(controls.getAzimuthalAngle()).toBeCloseTo(Math.PI / 2, 5)
			if (top) expect(controls.getPolarAngle()).toBeLessThan(0.000002)
		})

		test(`${top ? "2D" : "3D"} keeps an off-center point under the fingers during rotation`, () => {
			const { camera, controls } = setup(top)
			const pivot = new Vector2(0.4, -0.3)
			const ray = new Raycaster()
			camera.updateMatrixWorld()
			ray.setFromCamera(pivot, camera)
			const anchor = ray.ray.intersectPlane(
				new Plane(new Vector3(0, 1, 0), 0),
				new Vector3(),
			)
			if (!anchor) throw new Error("Expected the pivot ray to hit the floor")
			rotateIndoorAt(camera, controls, pivot, Math.PI / 3)
			const projected = anchor.project(camera)
			expect(projected.x).toBeCloseTo(pivot.x, 6)
			expect(projected.y).toBeCloseTo(pivot.y, 6)
		})
	}

	test("pinching along the same axis does not rotate the map", () => {
		const { controls, touch } = setup(true)
		touch.down(pointer(1, 300, 300, 0))
		touch.down(pointer(2, 500, 300, 0))
		touch.move(pointer(1, 200, 300, 16))
		touch.move(pointer(2, 600, 300, 16))
		controls.update()
		expect(controls.getAzimuthalAngle()).toBeCloseTo(0, 6)
	})

	test("wraps the angle across 180 degrees without a full turn", () => {
		const { controls, touch } = setup(true)
		touch.down(pointer(1, 500, 300, 0))
		touch.down(pointer(2, 300, 301, 0))
		touch.move(pointer(2, 300, 299, 16))
		controls.update()
		expect(Math.abs(controls.getAzimuthalAngle())).toBeLessThan(0.02)
	})

	test("release inertia settles and a new touch stops it", () => {
		const { camera, touch } = setup(true)
		const now = performance.now()
		touch.down(pointer(1, 300, 300, now))
		touch.down(pointer(2, 500, 300, now))
		touch.move(pointer(2, 480, 340, now + 16))
		touch.up(pointer(1, 300, 300, now + 20))
		touch.up(pointer(2, 480, 340, now + 21))
		expect(touch.update(performance.now() + 16)).toBe(true)
		expect(touch.update(performance.now() + 2000)).toBe(false)
		touch.down(pointer(3, 300, 300, now + 2100))
		touch.down(pointer(4, 500, 300, now + 2100))
		touch.move(pointer(4, 480, 340, now + 2116))
		touch.up(pointer(3, 300, 300, now + 2120))
		touch.up(pointer(4, 480, 340, now + 2121))
		expect(touch.update(performance.now() + 16)).toBe(true)
		touch.down(pointer(5, 300, 300, now + 2130))
		const rotation = camera.quaternion.clone()
		expect(touch.update(performance.now() + 2200)).toBe(false)
		expect(camera.quaternion.angleTo(rotation)).toBeLessThan(1e-7)
	})

	test("reduced motion keeps direct twist but disables release inertia", () => {
		const { controls, touch } = setup(true, true)
		touch.down(pointer(1, 300, 300, 0))
		touch.down(pointer(2, 500, 300, 0))
		touch.move(pointer(2, 480, 340, 16))
		touch.up(pointer(1, 300, 300, 20))
		touch.up(pointer(2, 480, 340, 21))
		controls.update()
		expect(controls.getAzimuthalAngle()).toBeGreaterThan(0.1)
		expect(touch.update(performance.now() + 16)).toBe(false)
	})
})
