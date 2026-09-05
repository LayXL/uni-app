import { describe, expect, test } from "bun:test"
import { OrthographicCamera, Vector3 } from "three"
import { MapControls } from "three/addons/controls/MapControls.js"

import {
	indoorFocusTarget,
	stopIndoorInertia,
	withIndoorViewTilt,
} from "./indoor-controls"

test("room focus stays horizontally centered at every heading, tilt and zoom", () => {
	for (const degrees of [-180, -70, 0, 70, 180]) {
		for (const tilt of [0.000001, 0.7, Math.PI / 3]) {
			for (const zoom of [0.6, 1, 2.5]) {
				const camera = new OrthographicCamera(-400, 400, 300, -300, 1, 10000)
				const point = new Vector3(320, 0, -170)
				const offset = new Vector3().setFromSphericalCoords(
					2400,
					tilt,
					(degrees * Math.PI) / 180,
				)
				const target = indoorFocusTarget(point, offset, 60 / zoom)
				camera.position.copy(target).add(offset)
				camera.lookAt(target)
				camera.zoom = zoom
				camera.updateProjectionMatrix()
				camera.updateMatrixWorld(true)
				const projected = point.clone().project(camera)
				expect(projected.x).toBeCloseTo(0, 8)
				expect(projected.y).toBeCloseTo(0.2, 8)
				expect(target.y).toBe(0)
			}
		}
	}
})

function setup(top: boolean) {
	const camera = new OrthographicCamera(-400, 400, 300, -300, 1, 10000)
	camera.position.set(0, 2000, top ? 0.001 : 1200)
	const controls = new MapControls(camera)
	// Public pan() only needs the viewport dimensions; no renderer or DOM events.
	controls.domElement = { clientWidth: 800, clientHeight: 600 } as HTMLElement
	controls.enableDamping = true
	controls.dampingFactor = 0.12
	controls.maxPolarAngle = top ? 0 : Math.PI / 3
	controls.update()
	return { camera, controls }
}

describe("indoor gesture inertia", () => {
	test("switching views preserves heading throughout the transition and after top-view rotation", () => {
		for (const heading of [-Math.PI + 0.01, -1.2, 0, 0.8, Math.PI - 0.01]) {
			const offset = new Vector3().setFromSphericalCoords(2400, 0.7, heading)
			const top = withIndoorViewTilt(offset, "top")
			for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
				const current = offset.clone().lerp(top, progress)
				expect(Math.atan2(current.x, current.z)).toBeCloseTo(heading, 8)
			}
			const restored = withIndoorViewTilt(top, "3d")
			expect(Math.atan2(restored.x, restored.z)).toBeCloseTo(heading, 8)
			expect(restored.length()).toBeCloseTo(offset.length(), 8)
			top.applyAxisAngle(new Vector3(0, 1, 0), 0.4)
			const rotated = withIndoorViewTilt(top, "3d")
			expect(Math.atan2(rotated.x, rotated.z)).toBeCloseTo(
				Math.atan2(top.x, top.z),
				8,
			)
		}
	})

	for (const top of [false, true]) {
		test(`${top ? "2D" : "3D"} pan and rotation glide, slow down, and stop requesting frames`, () => {
			const { controls } = setup(top)
			controls.pan(80, 30)
			controls.rotateLeft(0.4)
			const start = controls.target.clone()
			const angle = controls.getAzimuthalAngle()
			expect(controls.update()).toBe(true)
			const firstStep = controls.target.distanceTo(start)
			expect(firstStep).toBeGreaterThan(0)
			expect(controls.getAzimuthalAngle()).not.toBe(angle)
			const next = controls.target.clone()
			controls.update()
			expect(controls.target.distanceTo(next)).toBeLessThan(firstStep)
			let frames = 0
			while (controls.update() && frames < 300) frames++
			expect(frames).toBeLessThan(300)
			if (top) expect(controls.getPolarAngle()).toBeLessThan(0.000002)
		})
	}

	test("a new interaction clears momentum without jumping or leaking into a camera move", () => {
		const { camera, controls } = setup(false)
		controls.pan(100, 50)
		controls.rotateLeft(0.5)
		const position = camera.position.clone()
		const target = controls.target.clone()
		const rotation = camera.quaternion.clone()
		stopIndoorInertia(controls, camera)
		expect(camera.position.distanceTo(position)).toBeLessThan(1e-8)
		expect(controls.target.distanceTo(target)).toBeLessThan(1e-8)
		expect(camera.quaternion.angleTo(rotation)).toBeLessThan(1e-7)
		expect(controls.enableDamping).toBe(true)
		controls.target.set(500, 0, 500)
		camera.position.set(500, 2000, 1700)
		controls.update()
		for (let i = 0; i < 10; i++) expect(controls.update()).toBe(false)
		expect(controls.target.toArray()).toEqual([500, 0, 500])
	})

	test("reduced motion applies gestures immediately without residual movement", () => {
		const { camera, controls } = setup(false)
		controls.enableDamping = false
		controls.pan(80, 30)
		controls.rotateLeft(0.4)
		stopIndoorInertia(controls, camera)
		expect(controls.enableDamping).toBe(false)
		expect(controls.update()).toBe(false)
	})
})
