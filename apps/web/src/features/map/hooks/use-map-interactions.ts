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

type GestureNativeEvent = TouchEvent & {
	scale?: number
	rotation?: number
	clientX?: number
	clientY?: number
}

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
	const hadGestureRef = useRef(false)
	const gestureRef = useRef<{ scale: number; rotation: number } | null>(null)
	const nativeGestureRef = useRef<{
		prevDistance: number
		prevAngle: number
	} | null>(null)

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

	const startDrag = useCallback((event: PointerInfo) => {
		const coords = getPointerCoords(event.e)
		if (!coords) return

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
		(event: MouseEvent | TouchEvent) => {
			if (!isDraggingRef.current) return

			if ("touches" in event) {
				event.preventDefault()
			}

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
			// Touch events do not have button; start drag immediately.
			if ("touches" in event.e) {
				event.e.preventDefault()
				startDrag(event)
				return
			}

			if (
				"button" in event.e &&
				typeof (event.e as MouseEvent).button === "number"
			) {
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
					startDrag(event)
				}
			}
		},
		[getPointerData, onRightClick, startDrag],
	)

	const onMouseUp = useCallback(
		(event: PointerInfo) => {
			if (hadGestureRef.current) {
				hadGestureRef.current = false
				stopDrag()
				return
			}

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

	const onGesture = useCallback(
		(event: fabric.TEvent<TouchEvent>) => {
			const nativeEvent = event.e as GestureNativeEvent
			const scale = nativeEvent?.scale ?? 1
			const rotation = nativeEvent?.rotation ?? 0

			if (!gestureRef.current) {
				didDragRef.current = true
				hadGestureRef.current = true
				gestureRef.current = { scale, rotation }
				return
			}

			didDragRef.current = true
			hadGestureRef.current = true
			const scaleDelta = scale / (gestureRef.current.scale || 1)
			const canvas = fabricRef.current
			const touchPoint = nativeEvent.touches?.[0]

			const screenPoint = (() => {
				if (!canvas || !touchPoint) return new fabric.Point(0, 0)
				const rect = canvas.getElement().getBoundingClientRect()
				return new fabric.Point(
					touchPoint.clientX - rect.left,
					touchPoint.clientY - rect.top,
				)
			})()

			zoomAtPoint(screenPoint, scaleDelta)

			const rotationDelta =
				((rotation ?? 0) - (gestureRef.current.rotation ?? 0)) * (Math.PI / 180)
			rotateAtCenter(rotationDelta)

			gestureRef.current = { scale, rotation }
		},
		[fabricRef, rotateAtCenter, zoomAtPoint],
	)

	const onGestureEnd = useCallback(() => {
		didDragRef.current = true
		gestureRef.current = null
	}, [])

	useEffect(() => {
		const canvas = fabricRef.current
		if (!canvas) return

		type CanvasWithGesture = fabric.Canvas & {
			on(
				eventName: "touch:gesture" | "touch:gesture:end",
				handler: (event: fabric.TEvent<TouchEvent>) => void,
			): void
			off(
				eventName: "touch:gesture" | "touch:gesture:end",
				handler: (event: fabric.TEvent<TouchEvent>) => void,
			): void
		}

		const gestureCanvas = canvas as CanvasWithGesture

		canvas.on("mouse:wheel", onWheel)
		canvas.on("mouse:down", onMouseDown)
		canvas.on("mouse:move", handleMouseMove)
		canvas.on("mouse:up", onMouseUp)
		gestureCanvas.on("touch:gesture", onGesture)
		gestureCanvas.on("touch:gesture:end", onGestureEnd)

		let cleanupNative = () => {}

		if (canvas.upperCanvasEl) {
			canvas.upperCanvasEl.style.touchAction = "none"

			const getTouches = (event: TouchEvent) => {
				const first = event.touches[0]
				const second = event.touches[1]
				return first && second ? [first, second] : null
			}

			const handleTouchStart = (event: TouchEvent) => {
				if (event.touches.length < 2) return

				event.preventDefault()
				isDraggingRef.current = false
				didDragRef.current = true
				hadGestureRef.current = true

				const touches = getTouches(event)
				if (!touches) return

				const [t1, t2] = touches
				const dx = t1.clientX - t2.clientX
				const dy = t1.clientY - t2.clientY
				nativeGestureRef.current = {
					prevDistance: Math.hypot(dx, dy),
					prevAngle: Math.atan2(dy, dx),
				}
			}

			const handleTouchMove = (event: TouchEvent) => {
				if (!nativeGestureRef.current) return
				if (event.touches.length < 2) return

				event.preventDefault()
				const touches = getTouches(event)
				if (!touches) return

				const [t1, t2] = touches
				const dx = t1.clientX - t2.clientX
				const dy = t1.clientY - t2.clientY
				const distance = Math.hypot(dx, dy)
				const angle = Math.atan2(dy, dx)

				const { prevDistance, prevAngle } = nativeGestureRef.current
				const scaleDelta = distance / (prevDistance || 1)
				const rotationDelta = angle - prevAngle

				const rect = canvas.getElement().getBoundingClientRect()
				const center = new fabric.Point(
					(t1.clientX + t2.clientX) / 2 - rect.left,
					(t1.clientY + t2.clientY) / 2 - rect.top,
				)

				zoomAtPoint(center, scaleDelta)
				rotateAtCenter(rotationDelta)

				nativeGestureRef.current = {
					prevDistance: distance,
					prevAngle: angle,
				}
			}

			const handleTouchEnd = () => {
				nativeGestureRef.current = null
			}

			canvas.upperCanvasEl.addEventListener("touchstart", handleTouchStart, {
				passive: false,
			})
			canvas.upperCanvasEl.addEventListener("touchmove", handleTouchMove, {
				passive: false,
			})
			canvas.upperCanvasEl.addEventListener("touchend", handleTouchEnd)
			canvas.upperCanvasEl.addEventListener("touchcancel", handleTouchEnd)

			cleanupNative = () => {
				canvas.upperCanvasEl?.removeEventListener(
					"touchstart",
					handleTouchStart,
				)
				canvas.upperCanvasEl?.removeEventListener("touchmove", handleTouchMove)
				canvas.upperCanvasEl?.removeEventListener("touchend", handleTouchEnd)
				canvas.upperCanvasEl?.removeEventListener("touchcancel", handleTouchEnd)
			}
		}

		return () => {
			cleanupNative()
			canvas.off("mouse:wheel", onWheel)
			canvas.off("mouse:down", onMouseDown)
			canvas.off("mouse:move", handleMouseMove)
			canvas.off("mouse:up", onMouseUp)
			gestureCanvas.off("touch:gesture", onGesture)
			gestureCanvas.off("touch:gesture:end", onGestureEnd)
			if (canvas.upperCanvasEl) {
				canvas.upperCanvasEl.style.touchAction = ""
			}
		}
	}, [
		handleMouseMove,
		fabricRef,
		onGesture,
		onGestureEnd,
		onMouseDown,
		onMouseUp,
		onWheel,
		rotateAtCenter,
		zoomAtPoint,
	])

	useEffect(() => {
		const handleMove = (event: MouseEvent | TouchEvent) => {
			continueDragGlobal(event)
		}

		window.addEventListener("mousemove", handleMove)
		window.addEventListener("touchmove", handleMove, { passive: false })
		window.addEventListener("mouseup", stopDrag)
		window.addEventListener("touchend", stopDrag)
		window.addEventListener("touchcancel", stopDrag)

		return () => {
			window.removeEventListener("mousemove", handleMove)
			window.removeEventListener("touchmove", handleMove)
			window.removeEventListener("mouseup", stopDrag)
			window.removeEventListener("touchend", stopDrag)
			window.removeEventListener("touchcancel", stopDrag)
		}
	}, [continueDragGlobal, stopDrag])
}
