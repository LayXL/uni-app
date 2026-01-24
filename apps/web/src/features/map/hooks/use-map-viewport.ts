import * as fabric from "fabric"
import { type RefObject, useCallback, useEffect, useMemo } from "react"

import { clamp, createViewportMatrix } from "../lib/geometry"
import type { FabricMatrix, ViewportState } from "../types"
import { useMapState } from "./use-map-state"

type UseMapViewportParams = {
	fabricRef: RefObject<fabric.Canvas | null>
	textObjectsRef: RefObject<fabric.Text[]>
	labelBaseSizeRef: RefObject<WeakMap<fabric.FabricText, number>>
	iconObjectsRef: RefObject<fabric.Object[]>
	iconBaseScaleRef: RefObject<WeakMap<fabric.Object, number>>
	onViewportChange?: (next: ViewportState) => void
}

export const useMapViewport = ({
	fabricRef,
	textObjectsRef,
	labelBaseSizeRef,
	iconObjectsRef,
	iconBaseScaleRef,
	onViewportChange,
}: UseMapViewportParams) => {
	const viewportRef = useMemo<{ current: ViewportState }>(
		() => ({
			get current() {
				return useMapState.getState()
			},
			set current(next) {
				useMapState.getState().setViewport(next)
			},
		}),
		[],
	)

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

			iconObjectsRef.current.forEach((icon) => {
				icon.set("angle", rotationDeg)
				const baseScale =
					iconBaseScaleRef.current.get(icon) ??
					(icon.scaleX !== undefined ? icon.scaleX : 1)
				const baseScaleY =
					iconBaseScaleRef.current.get(icon) ??
					(icon.scaleY !== undefined ? icon.scaleY : 1)

				icon.set({
					scaleX: baseScale * fontScale,
					scaleY: baseScaleY * fontScale,
				})
				icon.set("dirty", true)
			})

			canvas.requestRenderAll()
			onViewportChange?.(next)
		},
		[
			fabricRef,
			iconBaseScaleRef,
			iconObjectsRef,
			labelBaseSizeRef,
			onViewportChange,
			textObjectsRef,
			viewportRef,
		],
	)

	// Subscribe to store changes to keep canvas in sync
	useEffect(() => {
		const unsubscribe = useMapState.subscribe((state) => {
			const canvas = fabricRef.current
			if (!canvas) return

			// Avoid redundant updates if the state matches what we last applied
			// Note: This simple check might need refinement if updates come from multiple sources rapidly
			// but for now it prevents loops if applyViewport updates the store which triggers subscription
			// However, currently applyViewport updates the store directly via viewportRef setter.
			// We need to be careful not to create an infinite loop.
			// Since useMapState is the source of truth now, we should probably just
			// apply whatever comes from the store.

			// We will need to check if the canvas viewport matches the store state
			// But getting viewport from canvas (viewportTransform) back to state is complex.
			// Instead, we can rely on the fact that applyViewport updates the store.
			// But if the store is updated from elsewhere (like route navigation), we need to reflect it.

			// Let's just apply it. To avoid loops, applyViewport uses viewportRef.current = next
			// which updates the store. So we need to separate "updating the store" from "updating the canvas".

			// Actually, let's look at applyViewport. It calls viewportRef.current = next.
			// And viewportRef.current setter calls useMapState.getState().setViewport(next).
			// So applyViewport writes to store.
			// This useEffect reads from store.
			// If we call applyViewport here, it will write to store again. Loop?
			// useMapState.setState compares new state with old state and only notifies if changed.
			// If we pass the exact same object or values, it shouldn't notify.
			// BUT applyViewport creates a new matrix and sets it on canvas.

			// The issue is that applyViewport is designed to be called by interaction handlers
			// which calculate the next state and want to apply it AND save it.
			// Here we are reacting to a save. We just want to apply it to canvas.

			// Let's extract the canvas update logic from applyViewport.

			canvas.setViewportTransform(createViewportMatrix(state))

			const rotationDeg = (-state.rotation * 180) / Math.PI
			const fontScale = clamp(1 / state.zoom ** 0.7, 0.75, 4)

			textObjectsRef.current.forEach((text) => {
				text.set("angle", rotationDeg)
				const baseFontSize =
					labelBaseSizeRef.current.get(text as fabric.FabricText) ??
					text.fontSize ??
					14
				text.set("fontSize", baseFontSize * fontScale)
				text.set("dirty", true)
			})

			iconObjectsRef.current.forEach((icon) => {
				icon.set("angle", rotationDeg)
				const baseScale =
					iconBaseScaleRef.current.get(icon) ??
					(icon.scaleX !== undefined ? icon.scaleX : 1)
				const baseScaleY =
					iconBaseScaleRef.current.get(icon) ??
					(icon.scaleY !== undefined ? icon.scaleY : 1)

				icon.set({
					scaleX: baseScale * fontScale,
					scaleY: baseScaleY * fontScale,
				})
				icon.set("dirty", true)
			})

			canvas.requestRenderAll()
		})

		return unsubscribe
	}, [
		fabricRef,
		iconBaseScaleRef,
		iconObjectsRef,
		labelBaseSizeRef,
		textObjectsRef,
	])

	const screenToWorld = useCallback(
		(point: fabric.Point, state: ViewportState) => {
			const inverted = fabric.util.invertTransform(
				createViewportMatrix(state),
			) as FabricMatrix
			return fabric.util.transformPoint(point, inverted)
		},
		[],
	)
	// ... rest of functions

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
		[applyViewport, fabricRef, screenToWorld, viewportRef],
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
		[applyViewport, fabricRef, screenToWorld, viewportRef],
	)

	return {
		viewportRef,
		applyViewport,
		screenToWorld,
		zoomAtPoint,
		rotateAtCenter,
	}
}
