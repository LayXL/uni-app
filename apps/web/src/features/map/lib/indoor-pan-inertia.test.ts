import { describe, expect, test } from "bun:test"
import { OrthographicCamera } from "three"
import { MapControls } from "three/addons/controls/MapControls.js"

import { createIndoorPanInertia } from "./indoor-pan-inertia"

function setup(
	top = false,
	reducedMotion = false,
	pointerType = "touch",
	button = 0,
	shiftKey = false,
	eventTimeOrigin = 0,
) {
	const camera = new OrthographicCamera(-400, 400, 300, -300, 1, 10000)
	camera.position.set(0, 2000, top ? 0.001 : 1200)
	const document = new EventTarget()
	const host = Object.assign(new EventTarget(), {
		ownerDocument: document,
		style: {},
		clientWidth: 800,
		clientHeight: 600,
		getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
		getRootNode: () => document,
		setPointerCapture: () => {},
		releasePointerCapture: () => {},
	}) as unknown as HTMLElement
	const controls = new MapControls(camera, host)
	controls.screenSpacePanning = false
	controls.enableDamping = false
	controls.update()
	let requested = 0
	let clock = 0
	const inertia = createIndoorPanInertia(
		controls,
		{ matches: reducedMotion } as MediaQueryList,
		() => requested++,
		() => clock,
	)
	controls.addEventListener("start", inertia.stop)
	const dispatch = (
		type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
		x: number,
		y: number,
		time: number,
		id = 1,
	) => {
		clock = time
		const event = Object.assign(new Event(type), {
			pointerId: id,
			pointerType,
			button,
			shiftKey,
			clientX: x,
			clientY: y,
			pageX: x,
			pageY: y,
		}) as PointerEvent
		Object.defineProperty(event, "timeStamp", { value: eventTimeOrigin + time })
		if (type === "pointerdown") {
			host.dispatchEvent(event)
			inertia.down(event)
		} else {
			// Match the scene's capture-phase processing before MapControls.
			if (type === "pointermove") inertia.move(event)
			else inertia.up(event, type === "pointercancel")
			if (type === "pointercancel") host.dispatchEvent(event)
			else document.dispatchEvent(event)
		}
	}
	const flick = () => {
		dispatch("pointerdown", 300, 300, 0)
		dispatch("pointermove", 320, 310, 16)
		dispatch("pointermove", 340, 320, 32)
		dispatch("pointerup", 340, 320, 36)
	}
	return {
		camera,
		controls,
		inertia,
		dispatch,
		flick,
		requested: () => requested,
	}
}

describe("indoor pan release inertia", () => {
	for (const top of [false, true]) {
		test(`${top ? "2D" : "3D"} tracks the finger immediately, then glides and settles`, () => {
			const { camera, controls, inertia, dispatch, requested } = setup(top)
			dispatch("pointerdown", 300, 300, 0)
			dispatch("pointermove", 340, 320, 32)
			expect(controls.target.x).toBeCloseTo(-40, 6)
			const released = controls.target.clone()
			const offset = camera.position.clone().sub(controls.target)
			expect(inertia.update(34)).toBe(false)
			dispatch("pointerup", 340, 320, 36)
			expect(requested()).toBe(1)
			expect(inertia.update(52)).toBe(true)
			const first = controls.target.clone().sub(released)
			expect(first.dot(released)).toBeGreaterThan(0)
			const previous = controls.target.clone()
			inertia.update(68)
			expect(controls.target.distanceTo(previous)).toBeLessThan(first.length())
			expect(
				camera.position.clone().sub(controls.target).distanceTo(offset),
			).toBeLessThan(1e-6)
			let now = 68
			while (now < 3000) {
				now += 16
				if (!inertia.update(now)) break
			}
			expect(now).toBeLessThan(3000)
			const settled = controls.target.clone()
			expect(inertia.update(now + 16)).toBe(false)
			expect(controls.target.distanceTo(settled)).toBe(0)
			controls.dispose()
		})
	}

	test("equal elapsed time gives the same glide at 60 Hz and 120 Hz", () => {
		const positions = [60, 120].map((fps) => {
			const { controls, inertia, flick } = setup()
			flick()
			for (let frame = 1; frame <= fps / 2; frame++)
				inertia.update(36 + (frame * 1000) / fps)
			const target = controls.target.clone()
			controls.dispose()
			return target
		})
		expect(positions[0].distanceTo(positions[1])).toBeLessThan(1e-7)
	})

	for (const reason of [
		"pause",
		"tap",
		"cancel",
		"reduced motion",
		"two fingers",
	]) {
		test(`${reason} does not launch a glide`, () => {
			const { controls, inertia, dispatch } = setup(
				false,
				reason === "reduced motion",
			)
			dispatch("pointerdown", 300, 300, 0)
			if (reason === "two fingers") dispatch("pointerdown", 500, 300, 1, 2)
			if (reason !== "tap") dispatch("pointermove", 340, 320, 32)
			dispatch(
				reason === "cancel" ? "pointercancel" : "pointerup",
				reason === "tap" ? 300 : 340,
				reason === "tap" ? 300 : 320,
				reason === "pause" ? 200 : 36,
			)
			if (reason === "two fingers") dispatch("pointerup", 500, 300, 40, 2)
			const target = controls.target.clone()
			expect(inertia.update(250)).toBe(false)
			expect(controls.target.distanceTo(target)).toBe(0)
			controls.dispose()
		})
	}

	for (const firstReleased of [1, 2]) {
		test(`a two-finger gesture never glides when finger ${firstReleased} lifts first`, () => {
			const { controls, inertia, dispatch } = setup()
			dispatch("pointerdown", 300, 300, 0)
			dispatch("pointermove", 340, 320, 16)
			dispatch("pointerdown", 500, 300, 20, 2)
			dispatch("pointermove", 360, 320, 32)
			dispatch("pointermove", 520, 300, 33, 2)
			dispatch("pointerup", 400, 320, 36, firstReleased)
			const remaining = firstReleased === 1 ? 2 : 1
			dispatch("pointermove", 540, 320, 48, remaining)
			dispatch("pointermove", 560, 320, 64, remaining)
			dispatch("pointerup", 580, 320, 68, remaining)
			const released = controls.target.clone()
			expect(inertia.update(84)).toBe(false)
			expect(controls.target.distanceTo(released)).toBe(0)

			// A fresh gesture with one finger can still fling normally.
			dispatch("pointerdown", 300, 300, 100)
			dispatch("pointermove", 340, 320, 116)
			dispatch("pointerup", 340, 320, 120)
			expect(inertia.update(136)).toBe(true)
			controls.dispose()
		})
	}

	for (const pointerType of ["touch", "mouse", "pen"]) {
		test(`${pointerType} release continues a drag after a stationary hold`, () => {
			const { controls, inertia, dispatch } = setup(false, false, pointerType)
			dispatch("pointerdown", 300, 300, 0)
			dispatch("pointermove", 340, 320, 1532)
			dispatch("pointerup", 340, 320, 1536)
			const released = controls.target.clone()
			expect(inertia.update(1552)).toBe(true)
			expect(controls.target.distanceTo(released)).toBeGreaterThan(1)
			controls.dispose()
		})
	}

	test("a touch release supplies the final movement when move events were coalesced", () => {
		const { controls, inertia, dispatch } = setup()
		dispatch("pointerdown", 300, 300, 0)
		dispatch("pointermove", 301, 300, 16)
		dispatch("pointerup", 340, 320, 32)
		const released = controls.target.clone()
		expect(inertia.update(48)).toBe(true)
		expect(controls.target.distanceTo(released)).toBeGreaterThan(1)
		controls.dispose()
	})

	test("a final touch event delayed by 100 ms still glides", () => {
		const { controls, inertia, dispatch } = setup()
		dispatch("pointerdown", 300, 300, 0)
		dispatch("pointermove", 340, 320, 32)
		dispatch("pointerup", 340, 320, 132)
		expect(inertia.update(148)).toBe(true)
		controls.dispose()
	})

	test("event timestamps with a different origin cannot freeze the animation", () => {
		const { controls, inertia, flick } = setup(
			false,
			false,
			"touch",
			0,
			false,
			1_700_000_000_000,
		)
		flick()
		const released = controls.target.clone()
		expect(inertia.update(52)).toBe(true)
		expect(controls.target.distanceTo(released)).toBeGreaterThan(1)
		controls.dispose()
	})

	for (const [button, shiftKey] of [
		[2, false],
		[0, true],
		[1, false],
	] as const) {
		test(`mouse button ${button}, shift ${shiftKey} never turns rotation/zoom into a pan`, () => {
			const { controls, inertia, flick } = setup(
				false,
				false,
				"mouse",
				button,
				shiftKey,
			)
			flick()
			const released = controls.target.clone()
			expect(inertia.update(52)).toBe(false)
			expect(controls.target.distanceTo(released)).toBe(0)
			controls.dispose()
		})
	}

	for (const interruption of ["touch", "camera move", "hidden"]) {
		test(`${interruption} stops a glide without moving the camera`, () => {
			const { controls, inertia, flick, dispatch } = setup()
			flick()
			inertia.update(52)
			const target = controls.target.clone()
			if (interruption === "touch") dispatch("pointerdown", 400, 400, 60)
			else if (interruption === "hidden") inertia.reset()
			else inertia.stop()
			expect(inertia.update(100)).toBe(false)
			expect(controls.target.distanceTo(target)).toBeLessThan(1e-7)
			controls.dispose()
		})
	}
})
