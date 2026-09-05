import { type OrthographicCamera, Spherical, Vector3 } from "three"
import type { MapControls } from "three/addons/controls/MapControls.js"

export function indoorFocusTarget(
	point: Vector3,
	offset: Vector3,
	verticalOffset: number,
) {
	const spherical = new Spherical().setFromVector3(offset)
	// Keep the target on the floor while reserving space below the point in
	// screen coordinates, regardless of the camera's heading or tilt.
	const distance = verticalOffset / Math.cos(spherical.phi)
	return point
		.clone()
		.add(
			new Vector3(
				Math.sin(spherical.theta) * distance,
				0,
				Math.cos(spherical.theta) * distance,
			),
		)
}

export function withIndoorViewTilt(offset: Vector3, view: "top" | "3d") {
	const spherical = new Spherical().setFromVector3(offset)
	// A tiny polar angle retains the heading at the top-view pole.
	spherical.phi =
		view === "top" ? 0.000001 : Math.atan2(Math.hypot(0.85, 1.65), 2)
	return new Vector3().setFromSpherical(spherical)
}

export function stopIndoorInertia(
	controls: MapControls,
	camera: OrthographicCamera,
) {
	const target = controls.target.clone()
	const position = camera.position.clone()
	const zoom = camera.zoom
	const damping = controls.enableDamping
	// An undamped update clears Three.js' pending motion. Restore the visible
	// camera immediately so stopping inertia never jumps to its projected endpoint.
	controls.enableDamping = false
	controls.update()
	controls.target.copy(target)
	camera.position.copy(position)
	camera.zoom = zoom
	camera.updateProjectionMatrix()
	controls.update()
	controls.enableDamping = damping
}
