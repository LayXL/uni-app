import * as fabric from "fabric"
import { useEffect, useRef } from "react"

type UseMapCanvasParams = {
	canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export const useMapCanvas = ({ canvasRef }: UseMapCanvasParams) => {
	const fabricRef = useRef<fabric.Canvas | null>(null)

	useEffect(() => {
		if (!canvasRef.current) return

		const host = canvasRef.current.parentElement

		const canvas = new fabric.Canvas(canvasRef.current, {
			selection: false,
			preserveObjectStacking: true,
		})

		canvas.skipOffscreen = false

		const setDimensions = () => {
			const width = host?.clientWidth ?? window.innerWidth
			const height = host?.clientHeight ?? window.innerHeight
			canvas.setDimensions({ width, height })

			if (canvas.wrapperEl) {
				canvas.wrapperEl.style.width = `${width}px`
				canvas.wrapperEl.style.height = `${height}px`
			}
			canvas.requestRenderAll()
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
	}, [canvasRef])

	return { fabricRef }
}
