import type { MapControls } from "three/addons/controls/MapControls.js"

type Sample = { x: number; y: number; time: number }

export function createIndoorPanInertia(
	controls: MapControls,
	reducedMotion: MediaQueryList,
	onChange: () => void,
) {
	const pointers = new Map<number, Sample>()
	let history: Sample[] = []
	let velocityX = 0
	let velocityY = 0
	let lastFrame = 0
	let coasting = false
	const sample = (event: PointerEvent): Sample => ({
		x: event.clientX,
		y: event.clientY,
		time: event.timeStamp,
	})
	const stop = () => {
		coasting = false
		velocityX = velocityY = 0
		history = []
	}
	return {
		stop,
		reset() {
			stop()
			pointers.clear()
		},
		down(event: PointerEvent) {
			stop()
			if (event.pointerType !== "touch") return
			const point = sample(event)
			pointers.set(event.pointerId, point)
			if (pointers.size === 1) history = [point]
		},
		move(event: PointerEvent) {
			if (!pointers.has(event.pointerId)) return
			const point = sample(event)
			pointers.set(event.pointerId, point)
			if (pointers.size !== 1 || !controls.enablePan) {
				history = []
				return
			}
			history.push(point)
			// Keep a short velocity window, including its leading sample.
			while (history.length > 2 && history[1].time < point.time - 80)
				history.shift()
		},
		up(event: PointerEvent, cancelled = false) {
			if (!pointers.delete(event.pointerId)) return
			if (cancelled || pointers.size > 0) {
				stop()
				// Rebase after a pinch or tilt before the remaining finger pans.
				const remaining = pointers.values().next().value
				if (!cancelled && pointers.size === 1 && remaining)
					history = [{ ...remaining, time: event.timeStamp }]
				return
			}
			const first = history[0]
			const last = history[history.length - 1]
			if (
				reducedMotion.matches ||
				!controls.enabled ||
				!controls.enablePan ||
				history.length < 2 ||
				event.timeStamp - last.time >= 80 ||
				Math.hypot(last.x - first.x, last.y - first.y) <= 6
			) {
				stop()
				return
			}
			const elapsed = Math.max(8, event.timeStamp - first.time)
			velocityX = (last.x - first.x) / elapsed
			velocityY = (last.y - first.y) / elapsed
			const speed = Math.hypot(velocityX, velocityY)
			const limit = Math.min(1, 3 / speed)
			velocityX *= limit
			velocityY *= limit
			coasting = speed > 0.08
			history = []
			lastFrame = event.timeStamp
			if (coasting) onChange()
		},
		update(now: number) {
			if (!coasting) return false
			if (reducedMotion.matches || !controls.enabled || !controls.enablePan) {
				stop()
				return false
			}
			const elapsed = Math.max(0, now - lastFrame)
			lastFrame = now
			const decay = Math.exp(-elapsed / 240)
			// Integrate the decay over elapsed time for equal travel at 60/120 Hz.
			const distance = 240 * (1 - decay) * controls.panSpeed
			controls.pan(velocityX * distance, velocityY * distance)
			velocityX *= decay
			velocityY *= decay
			coasting = Math.hypot(velocityX, velocityY) > 0.015
			return coasting
		},
	}
}
