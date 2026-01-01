import * as fabric from "fabric"
import { useCallback, useRef } from "react"

import { clamp, createViewportMatrix } from "../lib/geometry"
import type { FabricMatrix, ViewportState } from "../types"

type UseMapViewportParams = {
	fabricRef: React.MutableRefObject<fabric.Canvas | null>
	textObjectsRef: React.MutableRefObject<fabric.Text[]>
	labelBaseSizeRef: React.MutableRefObject<WeakMap<fabric.FabricText, number>>
	onViewportChange?: (next: ViewportState) => void
}

export const useMapViewport = ({
	fabricRef,
	textObjectsRef,
	labelBaseSizeRef,
	onViewportChange,
}: UseMapViewportParams) => {
	const viewportRef = useRef<ViewportState>({
		zoom: 1,
		rotation: 0,
		translateX: 0,
		translateY: 0,
	})

	const applyViewport = useCallback(
		(next: ViewportState) => {
			const canvas = fabricRef.current
			if (!canvas) return

			viewportRef.current = next
			canvas.setViewportTransform(createViewportMatrix(next))

			const rotationDeg = (-next.rotation * 180) / Math.PI
			const fontScale = clamp(1 / next.zoom ** 0.7, 0.75, 4)

			textObjectsRef.current.forEach((text) => {
				text.set("angle", rotationDeg)
				const baseFontSize =
					labelBaseSizeRef.current.get(text as fabric.FabricText) ??
					text.fontSize ??
					14
				text.set("fontSize", baseFontSize * fontScale)
				text.set("dirty", true)
			})

			canvas.requestRenderAll()
			onViewportChange?.(next)
		},
		[fabricRef, labelBaseSizeRef, onViewportChange, textObjectsRef],
	)

	const screenToWorld = useCallback(
		(point: fabric.Point, state: ViewportState) => {
			const inverted = fabric.util.invertTransform(
				createViewportMatrix(state),
			) as FabricMatrix
			return fabric.util.transformPoint(point, inverted)
		},
		[],
	)

	const zoomAtPoint = useCallback(
		(screenPoint: fabric.Point, deltaZoom: number) => {
			const canvas = fabricRef.current
			if (!canvas) return

			const state = viewportRef.current
			const worldPoint = screenToWorld(screenPoint, state)
			const nextZoom = clamp(state.zoom * deltaZoom, 0.05, 8)

			const nextState = { ...state, zoom: nextZoom }
			const screenAfter = fabric.util.transformPoint(
				worldPoint,
				createViewportMatrix(nextState),
			)

			nextState.translateX += screenPoint.x - screenAfter.x
			nextState.translateY += screenPoint.y - screenAfter.y

			applyViewport(nextState)
		},
		[applyViewport, fabricRef, screenToWorld],
	)

	const rotateAtCenter = useCallback(
		(deltaRadians: number) => {
			const canvas = fabricRef.current
			if (!canvas) return

			const state = viewportRef.current
			const center = new fabric.Point(
				canvas.getWidth() / 2,
				canvas.getHeight() / 2,
			)
			const worldCenter = screenToWorld(center, state)

			const nextState = {
				...state,
				rotation: state.rotation + deltaRadians,
			}

			const screenAfter = fabric.util.transformPoint(
				worldCenter,
				createViewportMatrix(nextState),
			)

			nextState.translateX += center.x - screenAfter.x
			nextState.translateY += center.y - screenAfter.y

			applyViewport(nextState)
		},
		[applyViewport, fabricRef, screenToWorld],
	)

	return {
		viewportRef,
		applyViewport,
		screenToWorld,
		zoomAtPoint,
		rotateAtCenter,
	}
}
