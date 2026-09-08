import { expect, test } from "bun:test"
import {
	BoxGeometry,
	DirectionalLight,
	Group,
	Mesh,
	MeshBasicMaterial,
	OrthographicCamera,
	Scene,
	Vector3,
} from "three"

import { createIndoorFloorTransition } from "./indoor-floor-transition"

const setup = (levelDelta = 1) => {
	const scene = new Scene()
	const shadow = new DirectionalLight().shadow
	shadow.intensity = 0.8
	const refreshed: boolean[] = []
	const camera = new OrthographicCamera()
	camera.zoom = 2
	const outgoing = new Group()
	outgoing.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial()))
	const incoming = new Group()
	const material = new MeshBasicMaterial({ opacity: 0.7, transparent: true })
	incoming.add(new Mesh(new BoxGeometry(), material))
	scene.add(outgoing, incoming)
	return {
		camera,
		outgoing,
		incoming,
		material,
		shadow,
		refreshed,
		transition: createIndoorFloorTransition(outgoing, incoming, 100, {
			levelDelta,
			pivot: new Vector3(10, 0, 20),
			shadow,
			refresh: () =>
				refreshed.push(outgoing.visible && outgoing.parent !== null),
		}),
	}
}

test("animates floor geometry while preserving the camera and final floor scale", () => {
	const { camera, outgoing, incoming, material, transition } = setup()
	expect(incoming.visible).toBe(false)
	expect(transition.update(175)).toBe(false)
	expect(camera.zoom).toBe(2)
	expect(outgoing.scale.x).toBeLessThan(1)
	expect(incoming.scale.x).toBeGreaterThan(1)
	expect(outgoing.visible).toBe(true)
	transition.update(250)
	expect(camera.zoom).toBe(2)
	expect(material.opacity).toBeCloseTo(0.35)
	expect(incoming.visible).toBe(true)
	expect(transition.update(400)).toBe(true)
	expect(camera.zoom).toBe(2)
	expect(incoming.scale.toArray()).toEqual([1, 1, 1])
	expect(incoming.position.toArray()).toEqual([0, 0, 0])
	expect(outgoing.parent).toBeNull()
	expect(material.opacity).toBe(0.7)
	expect(material.transparent).toBe(true)
	expect(material.depthWrite).toBe(true)
})

test("interruption preserves the current zoom and releases the outgoing floor only once", () => {
	const { camera, outgoing, incoming, transition } = setup()
	let disposals = 0
	;(outgoing.children[0] as Mesh).geometry.addEventListener(
		"dispose",
		() => disposals++,
	)
	transition.update(207.143)
	const interruptedZoom = camera.zoom
	transition.finish()
	transition.finish()
	expect(transition.update(242.857)).toBe(true)
	expect(camera.zoom).toBe(interruptedZoom)
	expect(incoming.visible).toBe(true)
	expect(incoming.scale.toArray()).toEqual([1, 1, 1])
	expect(incoming.position.toArray()).toEqual([0, 0, 0])
	expect(disposals).toBe(1)
})

test("fades cached shadows out and refreshes only after the old geometry is hidden", () => {
	const { shadow, refreshed, transition } = setup()
	transition.update(100)
	expect(shadow.intensity).toBe(0.8)
	transition.update(152.5)
	expect(shadow.intensity).toBeCloseTo(0.4)
	transition.update(205)
	expect(shadow.intensity).toBe(0)
	transition.update(250)
	expect(shadow.intensity).toBe(0)
	expect(refreshed).toHaveLength(0)
	transition.update(295)
	expect(shadow.intensity).toBe(0)
	expect(refreshed).toEqual([false])
	transition.update(347.5)
	expect(shadow.intensity).toBeCloseTo(0.4)
	transition.finish()
	expect(shadow.intensity).toBe(0.8)
	expect(refreshed).toEqual([false, false, false])
})

test("refreshes shadows immediately when a floor transition is interrupted", () => {
	const { shadow, refreshed, transition } = setup()
	transition.update(250)
	transition.finish()
	expect(shadow.intensity).toBe(0.8)
	expect(refreshed).toEqual([false])
})

test("visual zoom stays one-way in both directions without changing the final scale", () => {
	for (const levelDelta of [1, -1, 3]) {
		const { camera, outgoing, incoming, transition } = setup(levelDelta)
		let previousOut = outgoing.scale.x
		let previousIn = incoming.scale.x
		for (let now = 100; now < 400; now += 10) {
			transition.update(now)
			for (const [current, previous] of [
				[outgoing.scale.x, previousOut],
				[incoming.scale.x, previousIn],
			]) {
				if (levelDelta > 0) expect(current).toBeLessThanOrEqual(previous)
				else expect(current).toBeGreaterThanOrEqual(previous)
			}
			previousOut = outgoing.scale.x
			previousIn = incoming.scale.x
			expect(camera.zoom).toBe(2)
		}
		transition.update(400)
		expect(camera.zoom).toBe(2)
		expect(incoming.scale.toArray()).toEqual([1, 1, 1])
		expect(incoming.position.toArray()).toEqual([0, 0, 0])
	}
})
