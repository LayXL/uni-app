import {
	type MouseEvent,
	type PointerEvent,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
} from "react"

import type { StarScene } from "./star-scene"

type Gesture = {
	id: number
	x: number
	y: number
	startedAt: number
	maxDistance: number
	button: HTMLButtonElement
}

const pointInButton = (event: MouseEvent<HTMLButtonElement>) => {
	const rect = event.currentTarget.getBoundingClientRect()
	return {
		x: Math.max(
			-1,
			Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2),
		),
		y: Math.max(
			-1,
			Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2),
		),
	}
}

export function useStarPointer(
	scene: RefObject<StarScene | null>,
	onTap: (x: number, y: number, double: boolean) => void,
) {
	const gesture = useRef<Gesture | null>(null)
	const suppressClick = useRef(false)
	const lastTap = useRef<{ time: number; x: number; y: number } | null>(null)

	const cancel = useCallback(() => {
		const active = gesture.current
		gesture.current = null
		lastTap.current = null
		suppressClick.current = true
		scene.current?.release()
		scene.current?.hover(null)
		if (active) {
			delete active.button.dataset.held
			if (active.button.hasPointerCapture(active.id))
				active.button.releasePointerCapture(active.id)
		}
	}, [scene])

	useEffect(() => {
		const onVisibility = () => {
			if (document.hidden) cancel()
		}
		window.addEventListener("blur", cancel)
		document.addEventListener("visibilitychange", onVisibility)
		return () => {
			window.removeEventListener("blur", cancel)
			document.removeEventListener("visibilitychange", onVisibility)
			cancel()
		}
	}, [cancel])

	function hover(event: PointerEvent<HTMLButtonElement>) {
		if (
			!gesture.current &&
			event.pointerType !== "touch" &&
			event.buttons === 0
		) {
			scene.current?.hover(pointInButton(event))
		}
	}

	function down(event: PointerEvent<HTMLButtonElement>) {
		if (!event.isPrimary || event.button !== 0 || gesture.current) return
		suppressClick.current = false
		gesture.current = {
			id: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			startedAt: event.timeStamp,
			maxDistance: 0,
			button: event.currentTarget,
		}
		event.currentTarget.setPointerCapture(event.pointerId)
		event.currentTarget.dataset.held = "true"
		const point = pointInButton(event)
		scene.current?.hold(point.x, point.y)
	}

	function move(event: PointerEvent<HTMLButtonElement>) {
		const active = gesture.current
		if (!active) {
			hover(event)
			return
		}
		if (active.id !== event.pointerId) return
		const dx = event.clientX - active.x
		const dy = event.clientY - active.y
		active.maxDistance = Math.max(active.maxDistance, Math.hypot(dx, dy))
		if (active.maxDistance > 7) lastTap.current = null
		const rect = event.currentTarget.getBoundingClientRect()
		scene.current?.pull(dx / (rect.width / 2), dy / (rect.height / 2))
	}

	function up(event: PointerEvent<HTMLButtonElement>) {
		const active = gesture.current
		if (!active || active.id !== event.pointerId) return
		const distance = Math.max(
			active.maxDistance,
			Math.hypot(event.clientX - active.x, event.clientY - active.y),
		)
		suppressClick.current =
			distance > 7 || event.timeStamp - active.startedAt > 500
		if (suppressClick.current) lastTap.current = null
		gesture.current = null
		delete event.currentTarget.dataset.held
		scene.current?.release()
		const rect = event.currentTarget.getBoundingClientRect()
		const inside =
			event.clientX >= rect.left &&
			event.clientX <= rect.right &&
			event.clientY >= rect.top &&
			event.clientY <= rect.bottom
		scene.current?.hover(
			event.pointerType !== "touch" && inside ? pointInButton(event) : null,
		)
		if (event.currentTarget.hasPointerCapture(event.pointerId))
			event.currentTarget.releasePointerCapture(event.pointerId)
	}

	function click(event: MouseEvent<HTMLButtonElement>) {
		const keyboard = event.detail === 0
		if (!keyboard && suppressClick.current) {
			suppressClick.current = false
			return
		}
		const point = keyboard ? { x: 0, y: 0 } : pointInButton(event)
		const previous = lastTap.current
		const double =
			previous !== null &&
			event.timeStamp - previous.time <= 350 &&
			Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <= 48
		lastTap.current = double
			? null
			: { time: event.timeStamp, x: event.clientX, y: event.clientY }
		onTap(point.x, point.y, double)
	}

	return {
		onClick: click,
		onPointerDown: down,
		onPointerMove: move,
		onPointerEnter: hover,
		onPointerUp: up,
		onPointerLeave: () => {
			if (!gesture.current) scene.current?.hover(null)
		},
		onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => {
			if (gesture.current?.id === event.pointerId) cancel()
		},
		onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => {
			if (gesture.current?.id === event.pointerId) cancel()
		},
		onBlur: cancel,
		onContextMenu: (event: MouseEvent<HTMLButtonElement>) => {
			event.preventDefault()
			cancel()
		},
	}
}
