import {
	MathUtils,
	type OrthographicCamera,
	Plane,
	Raycaster,
	Vector2,
	Vector3,
} from "three"
import type { MapControls } from "three/addons/controls/MapControls.js"

const up = new Vector3(0, 1, 0)
const ground = new Plane(up, 0)

export function rotateIndoorAt(
	camera: OrthographicCamera,
	controls: MapControls,
	pivot: Vector2,
	angle: number,
) {
	const ray = new Raycaster()
	camera.updateMatrixWorld()
	ray.setFromCamera(pivot, camera)
	const before = ray.ray.intersectPlane(ground, new Vector3())
	// Direct manipulation follows the fingers 1:1; damping is applied on release.
	camera.position
		.sub(controls.target)
		.applyAxisAngle(up, angle)
		.add(controls.target)
	camera.lookAt(controls.target)
	camera.updateMatrixWorld()
	ray.setFromCamera(pivot, camera)
	const after = ray.ray.intersectPlane(ground, new Vector3())
	if (before && after) {
		const offset = before.sub(after)
		camera.position.add(offset)
		controls.target.add(offset)
		camera.updateMatrixWorld()
	}
}

export function createIndoorTouchRotation(
	host: HTMLElement,
	camera: OrthographicCamera,
	controls: MapControls,
	reducedMotion: MediaQueryList,
	onChange: () => void,
) {
	const pointers = new Map<number, Vector2>()
	const pivot = new Vector2()
	let angle: number | null = null
	let velocity = 0
	let lastMove = 0
	let lastFrame = 0
	let coasting = false
	const sample = () => {
		const [a, b] = [...pointers.values()]
		if (!a || !b) return null
		const rect = host.getBoundingClientRect()
		pivot.set(
			(a.x + b.x - 2 * rect.left) / rect.width - 1,
			1 - (a.y + b.y - 2 * rect.top) / rect.height,
		)
		return a.distanceTo(b) >= 12 ? Math.atan2(b.y - a.y, b.x - a.x) : null
	}
	const stop = () => {
		coasting = false
		velocity = 0
		angle = sample()
	}
	return {
		stop,
		down(event: PointerEvent) {
			stop()
			if (event.pointerType !== "touch") return
			pointers.set(event.pointerId, new Vector2(event.clientX, event.clientY))
			angle = sample()
			lastMove = event.timeStamp
		},
		move(event: PointerEvent) {
			const pointer = pointers.get(event.pointerId)
			if (!pointer) return
			pointer.set(event.clientX, event.clientY)
			if (pointers.size !== 2) {
				velocity = 0
				return
			}
			const next = sample()
			if (next == null) {
				velocity = 0
				angle = null
				return
			}
			if (angle == null) {
				angle = next
				lastMove = event.timeStamp
				return
			}
			const delta = Math.atan2(Math.sin(next - angle), Math.cos(next - angle))
			const elapsed = Math.max(8, event.timeStamp - lastMove)
			velocity = MathUtils.clamp(delta / elapsed, -0.008, 0.008)
			angle = next
			lastMove = event.timeStamp
			rotateIndoorAt(camera, controls, pivot, delta)
			onChange()
		},
		up(event: PointerEvent, cancelled = false) {
			if (!pointers.delete(event.pointerId)) return
			if (cancelled || pointers.size >= 2) {
				stop()
				return
			}
			if (pointers.size === 0) {
				coasting =
					!reducedMotion.matches &&
					event.timeStamp - lastMove < 80 &&
					Math.abs(velocity) > 0.00002
				lastFrame = performance.now()
				if (coasting) onChange()
			}
		},
		update(now: number) {
			if (!coasting) return false
			const elapsed = Math.max(0, now - lastFrame)
			lastFrame = now
			const decay = Math.exp(-elapsed / 160)
			rotateIndoorAt(camera, controls, pivot, velocity * 160 * (1 - decay))
			velocity *= decay
			coasting = Math.abs(velocity) > 0.00002
			return coasting
		},
	}
}
