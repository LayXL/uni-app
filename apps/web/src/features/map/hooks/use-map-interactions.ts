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
}: UseMapInteractionsParams) => {
	const isDraggingRef = useRef(false)
	const dragLastRef = useRef<{ x: number; y: number } | null>(null)
	const gestureRef = useRef<{ scale: number; rotation: number } | null>(null)

	const startDrag = useCallback((event: PointerInfo) => {
		const coords = getPointerCoords(event.e)
		if (!coords) return

		isDraggingRef.current = true
		dragLastRef.current = coords
	}, [])

	const applyDragDelta = useCallback(
		(coords: { x: number; y: number }) => {
			if (!dragLastRef.current) return

			const deltaX = coords.x - dragLastRef.current.x
			const deltaY = coords.y - dragLastRef.current.y

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

	const continueDrag = useCallback(
		(event: PointerInfo) => {
			if (!isDraggingRef.current) return

			const coords = getPointerCoords(event.e)
			if (!coords) return

			applyDragDelta(coords)
		},
		[applyDragDelta],
	)

	const continueDragGlobal = useCallback(
		(event: MouseEvent | TouchEvent) => {
			if (!isDraggingRef.current) return

			const coords = getPointerCoords(event)
			if (!coords) return

			applyDragDelta(coords)
		},
		[applyDragDelta],
	)

	const stopDrag = useCallback(() => {
		isDraggingRef.current = false
		dragLastRef.current = null
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
			if (
				"button" in event.e &&
				typeof (event.e as MouseEvent).button === "number" &&
				(((event.e as MouseEvent).button ?? 0) === 0 ||
					(event.e as MouseEvent).button === 1)
			) {
				startDrag(event)
			}
		},
		[startDrag],
	)

	const onGesture = useCallback(
		(event: fabric.TEvent<TouchEvent>) => {
			const nativeEvent = event.e as GestureNativeEvent
			const scale = nativeEvent?.scale ?? 1
			const rotation = nativeEvent?.rotation ?? 0

			if (!gestureRef.current) {
				gestureRef.current = { scale, rotation }
				return
			}

			const scaleDelta = scale / (gestureRef.current.scale || 1)
			const canvas = fabricRef.current
			const touchPoint = nativeEvent.touches?.[0]

			zoomAtPoint(
				new fabric.Point(
					touchPoint?.clientX ?? canvas?.getWidth() ?? 0,
					touchPoint?.clientY ?? canvas?.getHeight() ?? 0,
				),
				scaleDelta,
			)

			const rotationDelta =
				((rotation ?? 0) - (gestureRef.current.rotation ?? 0)) * (Math.PI / 180)
			rotateAtCenter(rotationDelta)

			gestureRef.current = { scale, rotation }
		},
		[fabricRef, rotateAtCenter, zoomAtPoint],
	)

	const onGestureEnd = useCallback(() => {
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
		canvas.on("mouse:move", continueDrag)
		canvas.on("mouse:up", stopDrag)
		gestureCanvas.on("touch:gesture", onGesture)
		gestureCanvas.on("touch:gesture:end", onGestureEnd)

		return () => {
			canvas.off("mouse:wheel", onWheel)
			canvas.off("mouse:down", onMouseDown)
			canvas.off("mouse:move", continueDrag)
			canvas.off("mouse:up", stopDrag)
			gestureCanvas.off("touch:gesture", onGesture)
			gestureCanvas.off("touch:gesture:end", onGestureEnd)
		}
	}, [
		continueDrag,
		fabricRef,
		onGesture,
		onGestureEnd,
		onMouseDown,
		onWheel,
		stopDrag,
	])

	useEffect(() => {
		const handleMove = (event: MouseEvent | TouchEvent) => {
			continueDragGlobal(event)
		}

		window.addEventListener("mousemove", handleMove)
		window.addEventListener("touchmove", handleMove)
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
