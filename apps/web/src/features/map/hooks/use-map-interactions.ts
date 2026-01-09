import * as fabric from "fabric"
import { useCallback, useEffect, useRef } from "react"

import { getPointerCoords } from "../lib/pointer"
import type { PointerInfo, ViewportState } from "../types"

type UseMapInteractionsParams = {
	fabricRef: React.MutableRefObject<fabric.Canvas | null>
	zoomAtPoint: (screenPoint: fabric.Point, deltaZoom: number) => void
	rotateAtCenter: (deltaRadians: number) => void
	applyViewport: (next: ViewportState) => void
	viewportRef: React.MutableRefObject<ViewportState>
	screenToWorld: (point: fabric.Point, state: ViewportState) => fabric.Point
	onRoomClick?: (roomId: number) => void
	onPointerMove?: (coords: {
		screen: { x: number; y: number }
		world: { x: number; y: number }
	}) => void
	onRightClick?: (coords: {
		screen: { x: number; y: number }
		world: { x: number; y: number }
	}) => void
}

type TouchState = {
	startTime: number
	startPos: { x: number; y: number }
	lastPos: { x: number; y: number }
	moved: boolean
}

type MultiTouchState = {
	initialDistance: number
	initialAngle: number
	initialCenter: { x: number; y: number }
	lastDistance: number
	lastAngle: number
}

const getTouchDistance = (t1: Touch, t2: Touch): number => {
	const dx = t2.clientX - t1.clientX
	const dy = t2.clientY - t1.clientY
	return Math.sqrt(dx * dx + dy * dy)
}

const getTouchAngle = (t1: Touch, t2: Touch): number => {
	return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX)
}

const getTouchCenter = (
	t1: Touch,
	t2: Touch,
): { x: number; y: number } => {
	return {
		x: (t1.clientX + t2.clientX) / 2,
		y: (t1.clientY + t2.clientY) / 2,
	}
}

const TAP_THRESHOLD_PX = 10
const TAP_THRESHOLD_MS = 300

export const useMapInteractions = ({
	fabricRef,
	zoomAtPoint,
	rotateAtCenter,
	applyViewport,
	viewportRef,
	screenToWorld,
	onRoomClick,
	onPointerMove,
	onRightClick,
}: UseMapInteractionsParams) => {
	const isDraggingRef = useRef(false)
	const dragLastRef = useRef<{ x: number; y: number } | null>(null)
	const didDragRef = useRef(false)

	// Touch-specific state
	const touchStateRef = useRef<TouchState | null>(null)
	const multiTouchRef = useRef<MultiTouchState | null>(null)
	const activeTouchCountRef = useRef(0)

	const getPointerData = useCallback(
		(event: MouseEvent | TouchEvent | fabric.TPointerEvent) => {
			const canvas = fabricRef.current
			if (!canvas) return null

			const clientCoords = getPointerCoords(event)
			if (!clientCoords) return null

			const rect = canvas.getElement().getBoundingClientRect()
			const screen = {
				x: clientCoords.x - rect.left,
				y: clientCoords.y - rect.top,
			}
			const worldPoint = screenToWorld(
				new fabric.Point(screen.x, screen.y),
				viewportRef.current,
			)

			return {
				screen,
				world: { x: worldPoint.x, y: worldPoint.y },
			}
		},
		[fabricRef, screenToWorld, viewportRef],
	)

	const reportPointer = useCallback(
		(event: MouseEvent | TouchEvent | fabric.TPointerEvent) => {
			if (!onPointerMove) return

			const coords = getPointerData(event)
			if (!coords) return

			onPointerMove(coords)
		},
		[getPointerData, onPointerMove],
	)

	const startDrag = useCallback((coords: { x: number; y: number }) => {
		isDraggingRef.current = true
		dragLastRef.current = coords
		didDragRef.current = false
	}, [])

	const applyDragDelta = useCallback(
		(coords: { x: number; y: number }) => {
			if (!dragLastRef.current) return

			const deltaX = coords.x - dragLastRef.current.x
			const deltaY = coords.y - dragLastRef.current.y

			if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
				didDragRef.current = true
			}

			dragLastRef.current = coords

			const current = viewportRef.current
			applyViewport({
				...current,
				translateX: current.translateX + deltaX,
				translateY: current.translateY + deltaY,
			})
		},
		[applyViewport, viewportRef],
	)

	const handleMouseMove = useCallback(
		(event: PointerInfo) => {
			reportPointer(event.e)

			if (!isDraggingRef.current) return

			const coords = getPointerCoords(event.e)
			if (!coords) return

			applyDragDelta(coords)
		},
		[applyDragDelta, reportPointer],
	)

	const continueDragGlobal = useCallback(
		(event: MouseEvent) => {
			if (!isDraggingRef.current) return

			const coords = getPointerCoords(event)
			if (!coords) return

			applyDragDelta(coords)
			reportPointer(event)
		},
		[applyDragDelta, reportPointer],
	)

	const stopDrag = useCallback(() => {
		isDraggingRef.current = false
		dragLastRef.current = null
		didDragRef.current = false
	}, [])

	const onWheel = useCallback(
		(event: fabric.TEvent<WheelEvent>) => {
			event.e.preventDefault()

			const screenPoint = new fabric.Point(event.e.offsetX, event.e.offsetY)

			if (event.e.altKey || event.e.ctrlKey) {
				const deltaRotation = (event.e.deltaY / 500) * Math.PI
				rotateAtCenter(deltaRotation)
				return
			}

			const deltaZoom = event.e.deltaY > 0 ? 0.985 : 1.015
			zoomAtPoint(screenPoint, deltaZoom)
		},
		[rotateAtCenter, zoomAtPoint],
	)

	const onMouseDown = useCallback(
		(event: PointerInfo) => {
			// Only handle actual mouse events, not touch
			if (!("button" in event.e)) return

			const mouseEvent = event.e as MouseEvent

			if (mouseEvent.button === 2) {
				mouseEvent.preventDefault()
				mouseEvent.stopPropagation()

				if (onRightClick) {
					const coords = getPointerData(event.e)
					if (coords) onRightClick(coords)
				}

				return
			}

			if (mouseEvent.button === 0 || mouseEvent.button === 1) {
				const coords = getPointerCoords(event.e)
				if (coords) startDrag(coords)
			}
		},
		[getPointerData, onRightClick, startDrag],
	)

	const onMouseUp = useCallback(
		(event: PointerInfo) => {
			// Only handle mouse clicks, not touch (touch has its own handler)
			if (!("button" in event.e)) return

			if (!didDragRef.current) {
				const target = event.target as
					| (fabric.Object & { data?: { roomId?: number } })
					| undefined

				const roomId = target?.data?.roomId
				if (roomId !== undefined && onRoomClick) {
					onRoomClick(roomId)
				}
			}

			stopDrag()
		},
		[onRoomClick, stopDrag],
	)

	// Touch handlers
	const handleTouchStart = useCallback(
		(event: TouchEvent) => {
			const canvas = fabricRef.current
			if (!canvas) return

			const canvasEl = canvas.getElement()
			const rect = canvasEl.getBoundingClientRect()

			// Check if touch is on canvas
			const touch = event.touches[0]
			if (!touch) return

			const isOnCanvas =
				touch.clientX >= rect.left &&
				touch.clientX <= rect.right &&
				touch.clientY >= rect.top &&
				touch.clientY <= rect.bottom

			if (!isOnCanvas) return

			event.preventDefault()

			activeTouchCountRef.current = event.touches.length

			if (event.touches.length === 1) {
				// Single touch - start potential drag or tap
				const t = event.touches[0]
				touchStateRef.current = {
					startTime: Date.now(),
					startPos: { x: t.clientX, y: t.clientY },
					lastPos: { x: t.clientX, y: t.clientY },
					moved: false,
				}
				multiTouchRef.current = null
			} else if (event.touches.length === 2) {
				// Two-finger gesture - pinch/rotate
				const t1 = event.touches[0]
				const t2 = event.touches[1]

				const distance = getTouchDistance(t1, t2)
				const angle = getTouchAngle(t1, t2)
				const center = getTouchCenter(t1, t2)

				multiTouchRef.current = {
					initialDistance: distance,
					initialAngle: angle,
					initialCenter: center,
					lastDistance: distance,
					lastAngle: angle,
				}

				// Mark as moved to prevent tap detection
				if (touchStateRef.current) {
					touchStateRef.current.moved = true
				}
			}
		},
		[fabricRef],
	)

	const handleTouchMove = useCallback(
		(event: TouchEvent) => {
			if (activeTouchCountRef.current === 0) return

			event.preventDefault()

			const canvas = fabricRef.current
			if (!canvas) return

			if (event.touches.length === 1 && touchStateRef.current && !multiTouchRef.current) {
				// Single finger pan
				const t = event.touches[0]
				const state = touchStateRef.current

				const deltaX = t.clientX - state.lastPos.x
				const deltaY = t.clientY - state.lastPos.y

				// Check if moved enough to be considered a drag
				const totalDeltaX = t.clientX - state.startPos.x
				const totalDeltaY = t.clientY - state.startPos.y
				if (
					Math.abs(totalDeltaX) > TAP_THRESHOLD_PX ||
					Math.abs(totalDeltaY) > TAP_THRESHOLD_PX
				) {
					state.moved = true
				}

				state.lastPos = { x: t.clientX, y: t.clientY }

				// Apply panning
				const current = viewportRef.current
				applyViewport({
					...current,
					translateX: current.translateX + deltaX,
					translateY: current.translateY + deltaY,
				})
			} else if (event.touches.length === 2 && multiTouchRef.current) {
				// Two-finger pinch and rotate
				const t1 = event.touches[0]
				const t2 = event.touches[1]

				const distance = getTouchDistance(t1, t2)
				const angle = getTouchAngle(t1, t2)
				const center = getTouchCenter(t1, t2)

				const state = multiTouchRef.current

				// Calculate deltas
				const scaleDelta = distance / state.lastDistance
				const angleDelta = angle - state.lastAngle

				// Get canvas rect for proper coordinate conversion
				const rect = canvas.getElement().getBoundingClientRect()
				const screenCenter = new fabric.Point(
					center.x - rect.left,
					center.y - rect.top,
				)

				// Apply zoom at pinch center
				if (Math.abs(scaleDelta - 1) > 0.001) {
					zoomAtPoint(screenCenter, scaleDelta)
				}

				// Apply rotation
				if (Math.abs(angleDelta) > 0.001) {
					rotateAtCenter(angleDelta)
				}

				// Update state
				state.lastDistance = distance
				state.lastAngle = angle
			}
		},
		[applyViewport, fabricRef, rotateAtCenter, viewportRef, zoomAtPoint],
	)

	const handleTouchEnd = useCallback(
		(event: TouchEvent) => {
			const canvas = fabricRef.current
			if (!canvas) return

			const state = touchStateRef.current

			// Handle tap (single finger, not moved, quick touch)
			if (
				event.touches.length === 0 &&
				state &&
				!state.moved &&
				activeTouchCountRef.current === 1 &&
				Date.now() - state.startTime < TAP_THRESHOLD_MS
			) {
				// This was a tap - find the object under the tap position
				const rect = canvas.getElement().getBoundingClientRect()
				const screenPos = new fabric.Point(
					state.startPos.x - rect.left,
					state.startPos.y - rect.top,
				)

				// Use fabric's findTarget to properly handle viewport transforms
				// We need to simulate a pointer event for fabric to find the target
				const pointer = canvas.restorePointerVpt(screenPos)

				// Find the topmost interactive object at this position
				const objects = canvas.getObjects()
				for (let i = objects.length - 1; i >= 0; i--) {
					const obj = objects[i] as fabric.Object & {
						data?: { roomId?: number }
					}
					if (
						obj.data?.roomId !== undefined &&
						obj.evented &&
						obj.containsPoint(pointer)
					) {
						onRoomClick?.(obj.data.roomId)
						break
					}
				}
			}

			// Reset state
			if (event.touches.length === 0) {
				touchStateRef.current = null
				multiTouchRef.current = null
				activeTouchCountRef.current = 0
			} else if (event.touches.length === 1) {
				// Went from 2 to 1 finger - reset to single touch state
				multiTouchRef.current = null
				const t = event.touches[0]
				touchStateRef.current = {
					startTime: Date.now(),
					startPos: { x: t.clientX, y: t.clientY },
					lastPos: { x: t.clientX, y: t.clientY },
					moved: true, // Mark as moved to prevent tap on release
				}
				activeTouchCountRef.current = 1
			}
		},
		[fabricRef, onRoomClick],
	)

	// Fabric.js canvas events (mouse only)
	useEffect(() => {
		const canvas = fabricRef.current
		if (!canvas) return

		canvas.on("mouse:wheel", onWheel)
		canvas.on("mouse:down", onMouseDown)
		canvas.on("mouse:move", handleMouseMove)
		canvas.on("mouse:up", onMouseUp)

		return () => {
			canvas.off("mouse:wheel", onWheel)
			canvas.off("mouse:down", onMouseDown)
			canvas.off("mouse:move", handleMouseMove)
			canvas.off("mouse:up", onMouseUp)
		}
	}, [handleMouseMove, fabricRef, onMouseDown, onMouseUp, onWheel])

	// Global mouse events for drag outside canvas
	useEffect(() => {
		window.addEventListener("mousemove", continueDragGlobal)
		window.addEventListener("mouseup", stopDrag)

		return () => {
			window.removeEventListener("mousemove", continueDragGlobal)
			window.removeEventListener("mouseup", stopDrag)
		}
	}, [continueDragGlobal, stopDrag])

	// Touch events on canvas element directly
	useEffect(() => {
		const canvas = fabricRef.current
		if (!canvas) return

		const canvasEl = canvas.getElement()

		// Use passive: false to allow preventDefault
		canvasEl.addEventListener("touchstart", handleTouchStart, { passive: false })
		canvasEl.addEventListener("touchmove", handleTouchMove, { passive: false })
		canvasEl.addEventListener("touchend", handleTouchEnd, { passive: false })
		canvasEl.addEventListener("touchcancel", handleTouchEnd, { passive: false })

		return () => {
			canvasEl.removeEventListener("touchstart", handleTouchStart)
			canvasEl.removeEventListener("touchmove", handleTouchMove)
			canvasEl.removeEventListener("touchend", handleTouchEnd)
			canvasEl.removeEventListener("touchcancel", handleTouchEnd)
		}
	}, [fabricRef, handleTouchStart, handleTouchMove, handleTouchEnd])
}
