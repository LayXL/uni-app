import { expect, test } from "bun:test"
import {
	BoxGeometry,
	DirectionalLight,
	Group,
	Mesh,
	MeshBasicMaterial,
	OrthographicCamera,
	Scene,
} from "three"

import { createIndoorFloorTransition } from "./indoor-floor-transition"

const setup = (targetZoom = 2.16) => {
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
		transition: createIndoorFloorTransition(camera, outgoing, incoming, 100, {
			targetZoom,
			shadow,
			refresh: () =>
				refreshed.push(outgoing.visible && outgoing.parent !== null),
		}),
	}
}

test("zooms in one direction and crossfades geometry without resetting the view", () => {
	const { camera, outgoing, incoming, material, transition } = setup()
	expect(incoming.visible).toBe(false)
	expect(transition.update(205)).toBe(false)
	expect(camera.zoom).toBeCloseTo(2.025)
	expect(outgoing.visible).toBe(true)
	transition.update(310)
	expect(camera.zoom).toBeCloseTo(2.08)
	expect(material.opacity).toBeCloseTo(0.35)
	expect(incoming.visible).toBe(true)
	expect(transition.update(520)).toBe(true)
	expect(camera.zoom).toBe(2.16)
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
	transition.update(250)
	const interruptedZoom = camera.zoom
	transition.finish()
	transition.finish()
	expect(transition.update(300)).toBe(true)
	expect(camera.zoom).toBe(interruptedZoom)
	expect(incoming.visible).toBe(true)
	expect(disposals).toBe(1)
})

test("fades cached shadows out and refreshes only after the old geometry is hidden", () => {
	const { shadow, refreshed, transition } = setup()
	transition.update(100)
	expect(shadow.intensity).toBe(0.8)
	transition.update(173.5)
	expect(shadow.intensity).toBeCloseTo(0.4)
	transition.update(247)
	expect(shadow.intensity).toBe(0)
	transition.update(310)
	expect(shadow.intensity).toBe(0)
	expect(refreshed).toHaveLength(0)
	transition.update(373)
	expect(shadow.intensity).toBe(0)
	expect(refreshed).toEqual([false])
	transition.update(446.5)
	expect(shadow.intensity).toBeCloseTo(0.4)
	transition.finish()
	expect(shadow.intensity).toBe(0.8)
	expect(refreshed).toEqual([false, false])
})

test("refreshes shadows immediately when a floor transition is interrupted", () => {
	const { shadow, refreshed, transition } = setup()
	transition.update(310)
	transition.finish()
	expect(shadow.intensity).toBe(0.8)
	expect(refreshed).toEqual([false])
})

test("zoom stays monotonic in either floor direction, including after completion", () => {
	for (const targetZoom of [2.16, 2 / 1.08]) {
		const { camera, transition } = setup(targetZoom)
		let previous = camera.zoom
		for (let now = 100; now <= 520; now += 10) {
			transition.update(now)
			if (targetZoom > 2) expect(camera.zoom).toBeGreaterThanOrEqual(previous)
			else expect(camera.zoom).toBeLessThanOrEqual(previous)
			previous = camera.zoom
		}
		expect(camera.zoom).toBeCloseTo(targetZoom)
		transition.finish()
		expect(camera.zoom).toBeCloseTo(targetZoom)
	}
})
