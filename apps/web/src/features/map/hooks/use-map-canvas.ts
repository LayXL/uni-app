import * as fabric from "fabric"
import { type RefObject, useEffect, useRef } from "react"

import { useMapState } from "./use-map-state"

type UseMapCanvasParams = {
	canvasRef: RefObject<HTMLCanvasElement | null>
	fabricRef?: RefObject<fabric.Canvas | null>
	onResize?: (
		width: number,
		height: number,
		prevWidth: number | undefined,
		prevHeight: number | undefined,
	) => void
}

export const useMapCanvas = ({
	canvasRef,
	fabricRef: externalFabricRef,
	onResize,
}: UseMapCanvasParams) => {
	const internalFabricRef = useRef<fabric.Canvas | null>(null)
	const fabricRef = externalFabricRef || internalFabricRef
	const lastSizeRef = useRef<{ width: number; height: number } | null>(null)
	const onResizeRef = useRef(onResize)

	useEffect(() => {
		onResizeRef.current = onResize
	}, [onResize])

	useEffect(() => {
		if (!canvasRef.current) return

		const host = canvasRef.current.parentElement

		const canvas = new fabric.Canvas(canvasRef.current, {
			selection: false,
			preserveObjectStacking: true,
		})

		canvas.skipOffscreen = false

		const setDimensions = () => {
			const width = Math.max(
				Math.round(host?.clientWidth ?? window.innerWidth),
				1,
			)
			const height = Math.max(
				Math.round(host?.clientHeight ?? window.innerHeight),
				1,
			)

			const lastSize = lastSizeRef.current
			if (lastSize && lastSize.width === width && lastSize.height === height) {
				return
			}

			const prevWidth = lastSize?.width
			const prevHeight = lastSize?.height

			lastSizeRef.current = { width, height }

			// Update global store
			useMapState.getState().setCanvasSize(width, height)

			if (onResizeRef.current) {
				onResizeRef.current(width, height, prevWidth, prevHeight)
			}

			canvas.setDimensions({ width, height })

			if (canvas.wrapperEl) {
				canvas.wrapperEl.style.width = `${width}px`
				canvas.wrapperEl.style.height = `${height}px`
			}
			canvas.renderAll()
		}

		setDimensions()

		const resizeObserver = new ResizeObserver(() => setDimensions())
		if (host) {
			resizeObserver.observe(host)
		}

		fabricRef.current = canvas

		return () => {
			resizeObserver.disconnect()
			canvas.dispose()
			fabricRef.current = null
		}
	}, [canvasRef, fabricRef])

	return { fabricRef }
}
