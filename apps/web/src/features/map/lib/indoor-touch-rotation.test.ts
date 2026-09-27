import { describe, expect, test } from "bun:test"
import {
	OrthographicCamera,
	Plane,
	Raycaster,
	TOUCH,
	Vector2,
	Vector3,
} from "three"
import { MapControls } from "three/addons/controls/MapControls.js"

import {
	createIndoorTouchRotation,
	rotateIndoorAt,
} from "./indoor-touch-rotation"

function setup(top: boolean) {
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
		() => {},
		() => {
			controls.maxPolarAngle = Math.PI / 3
		},
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

	for (const firstReleased of [1, 2]) {
		test(`rotation stops immediately when finger ${firstReleased} lifts first`, () => {
			const { camera, controls, touch } = setup(true)
			touch.down(pointer(1, 300, 300, 0))
			touch.down(pointer(2, 500, 300, 0))
			touch.move(pointer(2, 480, 340, 16))
			controls.update()
			expect(controls.getAzimuthalAngle()).toBeGreaterThan(0.1)
			const rotation = camera.quaternion.clone()
			const target = controls.target.clone()
			const position = camera.position.clone()
			touch.up(pointer(firstReleased, 300, 300, 20))
			touch.up(pointer(firstReleased === 1 ? 2 : 1, 480, 340, 21))
			for (let i = 0; i < 120; i++) controls.update()
			expect(camera.quaternion.angleTo(rotation)).toBeLessThan(1e-7)
			expect(camera.position.distanceTo(position)).toBeLessThan(1e-7)
			expect(controls.target.distanceTo(target)).toBeLessThan(1e-7)
		})
	}
})

describe("two-finger indoor tilt", () => {
	for (const top of [true, false]) {
		test(`${top ? "2D" : "3D"} tilts up and down without changing heading, center, or zoom`, () => {
			const { camera, controls, touch } = setup(top)
			const initial = controls.getPolarAngle()
			const target = controls.target.clone()
			touch.down(pointer(1, 300, 300, 0))
			touch.down(pointer(2, 500, 300, 0))
			touch.move(pointer(1, 300, 290, 16))
			touch.move(pointer(2, 500, 290, 17))
			expect(controls.getPolarAngle()).toBeGreaterThan(initial)
			touch.move(pointer(1, 300, 220, 32))
			touch.move(pointer(2, 500, 220, 33))
			expect(controls.getPolarAngle()).toBeCloseTo(initial + Math.PI / 15, 5)
			touch.move(pointer(1, 300, 300, 48))
			touch.move(pointer(2, 500, 300, 49))
			expect(controls.getPolarAngle()).toBeCloseTo(initial, 5)
			expect(controls.getAzimuthalAngle()).toBeCloseTo(0, 5)
			expect(controls.target.distanceTo(target)).toBeLessThan(1e-7)
			expect(camera.zoom).toBe(1)
			touch.up(pointer(1, 300, 300, 50))
			touch.up(pointer(2, 500, 300, 51))
			expect(controls.update()).toBe(false)
		})
	}

	test("clamps tilt at the horizon limit and overhead view", () => {
		const { controls, touch } = setup(false)
		touch.down(pointer(1, 300, 300, 0))
		touch.down(pointer(2, 500, 300, 0))
		touch.move(pointer(1, 300, 290, 16))
		touch.move(pointer(2, 500, 290, 17))
		touch.move(pointer(1, 300, -1000, 32))
		touch.move(pointer(2, 500, -1000, 33))
		expect(controls.getPolarAngle()).toBeCloseTo(Math.PI / 3, 6)
		touch.move(pointer(1, 300, 2000, 48))
		touch.move(pointer(2, 500, 2000, 49))
		expect(controls.getPolarAngle()).toBeLessThan(0.000002)
	})

	for (const direction of ["pinch", "horizontal pan"] as const) {
		test(`${direction} preserves tilt and restores MapControls`, () => {
			const { controls, touch } = setup(false)
			const initial = controls.getPolarAngle()
			touch.down(pointer(1, 300, 300, 0))
			touch.down(pointer(2, 500, 300, 0))
			touch.move(pointer(1, 290, 300, 16))
			touch.move(pointer(2, direction === "pinch" ? 510 : 490, 300, 17))
			controls.update()
			expect(controls.getPolarAngle()).toBeCloseTo(initial, 6)
			expect(controls.enablePan).toBe(true)
			expect(controls.enableZoom).toBe(true)
		})
	}

	test("cancellation and hiding the map clear the gesture and restore controls", () => {
		const { controls, touch } = setup(false)
		touch.down(pointer(1, 300, 300, 0))
		touch.down(pointer(2, 500, 300, 0))
		touch.move(pointer(1, 300, 290, 16))
		touch.move(pointer(2, 500, 290, 17))
		expect(controls.enablePan).toBe(false)
		touch.up(pointer(1, 300, 290, 20))
		expect(controls.enablePan).toBe(true)
		expect(controls.enableZoom).toBe(true)
		touch.reset()
		const initial = controls.getPolarAngle()
		touch.down(pointer(3, 300, 300, 30))
		touch.move(pointer(3, 300, 100, 40))
		expect(controls.getPolarAngle()).toBe(initial)
	})

	test("MapControls tracks a tilt without pan/zoom and resumes one-finger dragging without a jump", () => {
		const { camera, controls, touch } = setup(false)
		const document = new EventTarget()
		const host = Object.assign(new EventTarget(), {
			ownerDocument: document,
			style: {},
			clientWidth: 800,
			clientHeight: 600,
			getRootNode: () => document,
			getBoundingClientRect: () => ({
				left: 0,
				top: 0,
				width: 800,
				height: 600,
			}),
			setPointerCapture: () => {},
			releasePointerCapture: () => {},
		}) as unknown as HTMLElement
		controls.connect(host)
		controls.touches.TWO = TOUCH.DOLLY_PAN
		const dispatch = (
			type: "pointerdown" | "pointermove" | "pointerup",
			id: number,
			x: number,
			y: number,
		) => {
			const event = Object.assign(new Event(type), {
				pointerId: id,
				pointerType: "touch",
				clientX: x,
				clientY: y,
				pageX: x,
				pageY: y,
			}) as PointerEvent
			if (type === "pointerdown") {
				host.dispatchEvent(event)
				touch.down(event)
			} else {
				// The scene handles move/up in the capture phase, before MapControls.
				if (type === "pointermove") touch.move(event)
				else touch.up(event)
				document.dispatchEvent(event)
			}
		}
		dispatch("pointerdown", 1, 300, 300)
		dispatch("pointerdown", 2, 500, 300)
		dispatch("pointermove", 1, 300, 290)
		dispatch("pointermove", 2, 500, 290)
		dispatch("pointermove", 1, 300, 200)
		dispatch("pointermove", 2, 500, 200)
		expect(controls.target.length()).toBeLessThan(1e-7)
		expect(camera.zoom).toBe(1)
		dispatch("pointerup", 2, 500, 200)
		dispatch("pointermove", 1, 300, 200)
		expect(controls.target.length()).toBeLessThan(1e-7)
		dispatch("pointermove", 1, 310, 200)
		expect(controls.target.length()).toBeCloseTo(10, 5)
		dispatch("pointerup", 1, 310, 200)
		controls.dispose()
	})
})
