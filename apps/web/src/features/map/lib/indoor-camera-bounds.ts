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

// A single convex envelope includes courtyards and gaps between wings. Those
// empty areas are valid places to navigate, not boundaries to push away from.
const floorEnvelope = (floors: Floor[]) => {
	const points = floors
		.filter((floor) => floor.wallsPosition.length >= 3)
		.flatMap((floor) =>
			floor.wallsPosition.map(
				(p) => new Vector3(p.x + floor.position.x, 0, p.y + floor.position.y),
			),
		)
		.sort((a, b) => a.x - b.x || a.z - b.z)
	const unique = points.filter((p, i) => i === 0 || !p.equals(points[i - 1]))
	const half = (ordered: Vector3[]) => {
		const hull: Vector3[] = []
		for (const point of ordered) {
			while (hull.length >= 2) {
				const a = hull[hull.length - 2]
				const b = hull[hull.length - 1]
				if ((b.x - a.x) * (point.z - a.z) - (b.z - a.z) * (point.x - a.x) > 0)
					break
				hull.pop()
			}
			hull.push(point)
		}
		return hull.slice(0, -1)
	}
	return [...half(unique), ...half([...unique].reverse())]
}

/** Keep the floor's overall envelope near the viewport center. */
export function createIndoorCameraConstraint(floors: Floor[], inset = 0.45) {
	const world = floorEnvelope(floors)
	const screen = world.map(() => new Vector2())
	const projected = new Vector3()
	const nearest = new Vector2()
	const candidate = new Vector2()
	const edge = new Vector2()
	const corner = new Vector2()
	const shift = new Vector3()
	const destination = new Vector3()
	const direction = new Vector3()

	return (
		camera: OrthographicCamera,
		target: Vector3,
		width: number,
		height: number,
	) => {
		if (world.length < 3 || width <= 1 || height <= 1) return false
		camera.updateMatrixWorld(true)
		// Inset each edge by 45% of the viewport so the floor reaches nearly
		// halfway across the screen, regardless of zoom or viewport size.
		const limitX = 1 - 2 * inset
		const limitY = 1 - 2 * inset
		let distance = Infinity
		const consider = (point: Vector2) => {
			const dx = (point.x - MathUtils.clamp(point.x, -limitX, limitX)) * width
			const dy = (point.y - MathUtils.clamp(point.y, -limitY, limitY)) * height
			const nextDistance = dx * dx + dy * dy
			if (nextDistance < distance) {
				distance = nextDistance
				nearest.copy(point)
			}
		}
		world.forEach((point, i) => {
			projected.copy(point).project(camera)
			screen[i].set(projected.x, projected.y)
		})
		if (containsOrigin(screen)) return false
		for (let i = 0; i < screen.length; i++) {
			const a = screen[i]
			edge.subVectors(screen[(i + 1) % screen.length], a)
			if (crossesViewport(a, edge, limitX, limitY)) return false
			// Find the shortest correction in screen pixels, including corners.
			consider(a)
			const length = (edge.x * width) ** 2 + (edge.y * height) ** 2
			for (const x of [-limitX, limitX]) {
				for (const y of [-limitY, limitY]) {
					corner.set(x - a.x, y - a.y)
					const t = MathUtils.clamp(
						(corner.x * edge.x * width ** 2 + corner.y * edge.y * height ** 2) /
							(length || 1),
						0,
						1,
					)
					consider(candidate.copy(a).addScaledVector(edge, t))
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

/** Resist outward pan displacement, without moving a stationary camera. */
export function createIndoorPanConstraint(floors: Floor[]) {
	const hard = createIndoorCameraConstraint(floors)
	const soft = createIndoorCameraConstraint(floors, 0.5)
	let previousCamera: OrthographicCamera | undefined
	let probe: OrthographicCamera | undefined
	let previousWidth = 0
	let previousHeight = 0
	const previousTarget = new Vector3()
	const probeTarget = new Vector3()
	const offset = new Vector3()
	const previousOffset = new Vector3()
	const correction = new Vector3()
	const origin = new Vector3()
	const projected = new Vector3()

	const measure = (
		camera: OrthographicCamera,
		target: Vector3,
		width: number,
		height: number,
	) => {
		probe ??= camera.clone()
		probe.copy(camera)
		probeTarget.copy(target)
		soft(probe, probeTarget, width, height)
		correction.subVectors(probeTarget, target)
		origin.copy(target).project(camera)
		projected.copy(probeTarget).project(camera).sub(origin)
		projected.x *= width / 2
		projected.y *= height / 2
		return Math.hypot(projected.x, projected.y)
	}

	return (
		camera: OrthographicCamera,
		target: Vector3,
		width: number,
		height: number,
		resistPan = true,
	) => {
		if (width <= 1 || height <= 1) return false
		camera.updateMatrixWorld(true)
		let resisted = false
		// Zoom, tilt, resize and programmatic moves use the hard constraint.
		// Only a translation with an unchanged view receives resistance.
		if (
			resistPan &&
			previousCamera &&
			width === previousWidth &&
			height === previousHeight &&
			target.distanceToSquared(previousTarget) > 1e-16 &&
			camera.projectionMatrix.equals(previousCamera.projectionMatrix) &&
			camera.quaternion.angleTo(previousCamera.quaternion) < 1e-7 &&
			offset
				.subVectors(camera.position, target)
				.distanceTo(
					previousOffset.subVectors(previousCamera.position, previousTarget),
				) < 1e-6
		) {
			const before = measure(previousCamera, previousTarget, width, height)
			const after = measure(camera, target, width, height)
			if (after > before + 1e-8) {
				// The band spans from the viewport center to the 45% inset.
				// Integrate decreasing sensitivity over the requested distance;
				// this also handles a single large/coalesced pointer event.
				const zone = Math.min(
					(width * 0.05 * after) / Math.max(Math.abs(projected.x), 1e-12),
					(height * 0.05 * after) / Math.max(Math.abs(projected.y), 1e-12),
				)
				const travel =
					Math.max(0, zone - before) * -Math.expm1(-(after - before) / zone)
				correction.multiplyScalar((after - before - travel) / after)
				camera.position.add(correction)
				target.add(correction)
				resisted = true
			}
		}
		const clamped = hard(camera, target, width, height)
		camera.updateMatrixWorld(true)
		previousCamera ??= camera.clone()
		previousCamera.copy(camera)
		previousTarget.copy(target)
		previousWidth = width
		previousHeight = height
		return resisted || clamped
	}
}
