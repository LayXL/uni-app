import { MathUtils, type OrthographicCamera, Vector2, Vector3 } from "three"

import type { Floor } from "@repo/shared/building-scheme"

const containsOrigin = (points: Vector2[]) => {
	let inside = false
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const a = points[i]
		const b = points[j]
		if (a.y > 0 !== b.y > 0 && 0 < a.x + ((b.x - a.x) * -a.y) / (b.y - a.y))
			inside = !inside
	}
	return inside
}

const crossesViewport = (a: Vector2, edge: Vector2, x: number, y: number) => {
	let enter = 0
	let exit = 1
	for (const [start, delta, limit] of [
		[a.x, edge.x, x],
		[a.y, edge.y, y],
	]) {
		if (Math.abs(delta) < 1e-12) {
			if (Math.abs(start) > limit + 1e-9) return false
			continue
		}
		const from = (-limit - start) / delta
		const to = (limit - start) / delta
		enter = Math.max(enter, Math.min(from, to))
		exit = Math.min(exit, Math.max(from, to))
		if (enter > exit + 1e-9) return false
	}
	return true
}

/** Keep a point on the actual floor visible, including concave and separate wings. */
export function createIndoorCameraConstraint(floors: Floor[]) {
	const footprints = floors
		.filter((floor) => floor.wallsPosition.length >= 3)
		.map((floor) =>
			[floor.wallsPosition, ...(floor.holes ?? [])].map((ring) => ({
				world: ring.map(
					(p) => new Vector3(p.x + floor.position.x, 0, p.y + floor.position.y),
				),
				screen: ring.map(() => new Vector2()),
			})),
		)
	const projected = new Vector3()
	const nearest = new Vector2()
	const candidate = new Vector2()
	const edge = new Vector2()
	const shift = new Vector3()
	const destination = new Vector3()
	const direction = new Vector3()

	return (
		camera: OrthographicCamera,
		target: Vector3,
		width: number,
		height: number,
	) => {
		if (!footprints.length || width <= 1 || height <= 1) return false
		camera.updateMatrixWorld(true)
		// Use screen-space margins so the visible portion survives zoom and resize.
		const limitX = 1 - (2 * Math.min(64, width * 0.15)) / width
		const limitY = 1 - (2 * Math.min(96, height * 0.15)) / height
		let distance = Infinity
		for (const rings of footprints) {
			for (const ring of rings) {
				ring.world.forEach((point, i) => {
					projected.copy(point).project(camera)
					ring.screen[i].set(projected.x, projected.y)
				})
			}
			if (
				containsOrigin(rings[0].screen) &&
				!rings.slice(1).some((ring) => containsOrigin(ring.screen))
			)
				return false
			for (const { screen } of rings) {
				for (let i = 0; i < screen.length; i++) {
					const a = screen[i]
					edge.subVectors(screen[(i + 1) % screen.length], a)
					if (crossesViewport(a, edge, limitX, limitY)) return false
					const t = MathUtils.clamp(-a.dot(edge) / (edge.lengthSq() || 1), 0, 1)
					candidate.copy(a).addScaledVector(edge, t)
					if (candidate.lengthSq() < distance) {
						distance = candidate.lengthSq()
						nearest.copy(candidate)
					}
				}
			}
		}
		if (!Number.isFinite(distance)) return false
		const x = MathUtils.clamp(nearest.x, -limitX, limitX)
		const y = MathUtils.clamp(nearest.y, -limitY, limitY)
		if (Math.abs(x - nearest.x) + Math.abs(y - nearest.y) < 1e-9) return false
		shift.set(nearest.x, nearest.y, 0).unproject(camera)
		destination.set(x, y, 0).unproject(camera)
		shift.sub(destination)
		// Translate along the floor, preserving camera height, heading and tilt.
		camera.getWorldDirection(direction)
		if (Math.abs(direction.y) < 1e-6) return false
		shift.addScaledVector(direction, -shift.y / direction.y)
		shift.y = 0
		camera.position.add(shift)
		target.add(shift)
		camera.updateMatrixWorld(true)
		return true
	}
}
