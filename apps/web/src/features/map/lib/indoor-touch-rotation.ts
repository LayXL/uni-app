import {
	MathUtils,
	type OrthographicCamera,
	Plane,
	Raycaster,
	Spherical,
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
	// Direct manipulation follows the fingers 1:1, without release inertia.
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
	onChange: () => void,
	onTiltStart: () => void = () => {},
) {
	const pointers = new Map<number, Vector2>()
	const pivot = new Vector2()
	let angle: number | null = null
	let gesture: {
		start: Vector2[]
		mode: "pending" | "tilt" | "map"
		lastY: number
	} | null = null
	let suspended: { pan: boolean; zoom: boolean } | null = null
	const resumeMapControls = () => {
		if (!suspended) return
		controls.enablePan = suspended.pan
		controls.enableZoom = suspended.zoom
		suspended = null
	}
	const suspendMapControls = () => {
		suspended ??= { pan: controls.enablePan, zoom: controls.enableZoom }
		// MapControls still tracks pointer positions, so lifting one finger can
		// resume panning without jumping to its position before the tilt.
		controls.enablePan = false
		controls.enableZoom = false
	}
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
		resumeMapControls()
		gesture = null
		angle = sample()
	}
	return {
		stop,
		reset() {
			pointers.clear()
			stop()
		},
		down(event: PointerEvent) {
			stop()
			if (event.pointerType !== "touch") return
			pointers.set(event.pointerId, new Vector2(event.clientX, event.clientY))
			if (pointers.size === 2) {
				const start = [...pointers.values()].map((point) => point.clone())
				gesture = {
					start,
					mode: "pending",
					lastY: (start[0].y + start[1].y) / 2,
				}
			}
			angle = sample()
		},
		move(event: PointerEvent) {
			const pointer = pointers.get(event.pointerId)
			if (!pointer) return
			pointer.set(event.clientX, event.clientY)
			if (pointers.size !== 2) return
			if (gesture && gesture.mode !== "map") {
				const [a, b] = [...pointers.values()]
				const [startA, startB] = gesture.start
				const dyA = a.y - startA.y
				const dyB = b.y - startB.y
				const y = (a.y + b.y) / 2
				if (gesture.mode === "pending") {
					const movedA = a.distanceTo(startA)
					const movedB = b.distanceTo(startB)
					const vertical =
						Math.abs(dyA) >= 6 &&
						Math.abs(dyB) >= 6 &&
						dyA * dyB > 0 &&
						Math.abs(dyA) > Math.abs(a.x - startA.x) * 1.5 &&
						Math.abs(dyB) > Math.abs(b.x - startB.x) * 1.5 &&
						Math.abs(dyA - dyB) < Math.abs(dyA + dyB) * 0.5
					if (vertical && controls.enableRotate) {
						gesture.mode = "tilt"
						onTiltStart()
					} else if (
						(movedA >= 6 && movedB >= 6) ||
						Math.max(movedA, movedB) > 30
					) {
						gesture.mode = "map"
						resumeMapControls()
					}
				}
				if (gesture.mode !== "map") {
					suspendMapControls()
					if (gesture.mode === "tilt") {
						const offset = camera.position.clone().sub(controls.target)
						const spherical = new Spherical().setFromVector3(offset)
						// A full-height swipe covers the usable tilt range. Up tilts
						// toward the horizon; down returns toward the overhead view.
						spherical.phi = MathUtils.clamp(
							spherical.phi -
								((y - gesture.lastY) * (Math.PI / 2)) /
									Math.max(host.getBoundingClientRect().height, 1),
							controls.minPolarAngle,
							controls.maxPolarAngle,
						)
						spherical.makeSafe()
						camera.position
							.copy(controls.target)
							.add(offset.setFromSpherical(spherical))
						controls.update()
						gesture.lastY = y
						onChange()
					}
					return
				}
			}
			const next = sample()
			if (next == null) {
				angle = null
				return
			}
			if (angle == null) {
				angle = next
				return
			}
			const delta = Math.atan2(Math.sin(next - angle), Math.cos(next - angle))
			angle = next
			rotateIndoorAt(camera, controls, pivot, delta)
			onChange()
		},
		up(event: PointerEvent) {
			if (!pointers.delete(event.pointerId)) return
			stop()
		},
	}
}
